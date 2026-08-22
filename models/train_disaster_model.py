"""
SAATHI Disaster Risk Model - Training Pipeline
Trains a high-performance Gradient Boosting / Random Forest model for real-time flood & disaster risk prediction.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, mean_squared_error, r2_score

FEATURE_NAMES = [
    "rainfall_mm_hr",
    "elevation_meters",
    "river_distance_meters",
    "water_level_rise_rate_cm_hr",
    "drainage_capacity_score",
    "soil_saturation_pct",
    "population_density_sq_km",
    "infrastructure_vulnerability"
]

def generate_synthetic_dataset(n_samples: int = 5000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic hydrological and geophysical flood scenario data.
    """
    np.random.seed(random_state)
    
    # 1. Rainfall (mm/hr): 0 to 120 mm/hr
    rainfall = np.random.gamma(shape=2.5, scale=12.0, size=n_samples)
    rainfall = np.clip(rainfall, 0.0, 150.0)
    
    # 2. Elevation (meters): 2m to 80m
    elevation = np.random.uniform(2.0, 80.0, size=n_samples)
    
    # 3. River Distance (meters): 20m to 5000m
    river_distance = np.random.exponential(scale=800.0, size=n_samples) + 20.0
    river_distance = np.clip(river_distance, 20.0, 6000.0)
    
    # 4. Water Level Rise Rate (cm/hr): 0 to 35 cm/hr
    water_rise = np.maximum(0.0, (rainfall * 0.28) - (elevation * 0.15) + np.random.normal(0, 2.0, size=n_samples))
    water_rise = np.clip(water_rise, 0.0, 45.0)
    
    # 5. Drainage Capacity (0.1 to 1.0)
    drainage = np.random.beta(a=3, b=2, size=n_samples)
    drainage = np.clip(drainage, 0.05, 1.0)
    
    # 6. Soil Saturation (%): 15% to 100%
    soil_saturation = np.clip(30.0 + (rainfall * 0.5) + np.random.normal(0, 8.0, size=n_samples), 10.0, 100.0)
    
    # 7. Population Density (people / sq km): 500 to 25000
    pop_density = np.random.uniform(500.0, 25000.0, size=n_samples)
    
    # 8. Infrastructure Vulnerability Index (0.1 to 1.0)
    infra_vuln = np.random.uniform(0.1, 1.0, size=n_samples)
    
    # Compute ground truth physical risk score (0.0 to 1.0)
    rain_factor = (rainfall / 100.0) * 0.30
    elev_factor = (1.0 - np.clip(elevation / 60.0, 0.0, 1.0)) * 0.20
    river_factor = (1.0 - np.clip(river_distance / 2000.0, 0.0, 1.0)) * 0.18
    drain_factor = (1.0 - drainage) * 0.12
    soil_factor = (soil_saturation / 100.0) * 0.10
    rise_factor = (water_rise / 30.0) * 0.10
    
    raw_risk = rain_factor + elev_factor + river_factor + drain_factor + soil_factor + rise_factor
    noise = np.random.normal(0, 0.03, size=n_samples)
    risk_score = np.clip(raw_risk + noise, 0.0, 1.0)
    
    # Categorize risk levels:
    # 0.00 - 0.25: LOW (0)
    # 0.25 - 0.55: MEDIUM (1)
    # 0.55 - 0.80: HIGH (2)
    # 0.80 - 1.00: CRITICAL (3)
    categories = []
    category_labels = []
    for r in risk_score:
        if r < 0.25:
            categories.append(0)
            category_labels.append("LOW")
        elif r < 0.55:
            categories.append(1)
            category_labels.append("MEDIUM")
        elif r < 0.80:
            categories.append(2)
            category_labels.append("HIGH")
        else:
            categories.append(3)
            category_labels.append("CRITICAL")
            
    df = pd.DataFrame({
        "rainfall_mm_hr": rainfall,
        "elevation_meters": elevation,
        "river_distance_meters": river_distance,
        "water_level_rise_rate_cm_hr": water_rise,
        "drainage_capacity_score": drainage,
        "soil_saturation_pct": soil_saturation,
        "population_density_sq_km": pop_density,
        "infrastructure_vulnerability": infra_vuln,
        "risk_score": risk_score,
        "risk_category": categories,
        "risk_label": category_labels
    })
    
    return df

def train_models():
    """
    Trains classification and regression pipelines and saves them.
    """
    print("[SAATHI ML] Generating synthetic hydrological training dataset...")
    df = generate_synthetic_dataset(n_samples=6000, random_state=42)
    
    X = df[FEATURE_NAMES]
    y_cat = df["risk_category"]
    y_reg = df["risk_score"]
    
    X_train, X_test, y_cat_train, y_cat_test, y_reg_train, y_reg_test = train_test_split(
        X, y_cat, y_reg, test_size=0.2, random_state=42, stratify=y_cat
    )
    
    print(f"[SAATHI ML] Training on {len(X_train)} samples, testing on {len(X_test)} samples...")
    
    # Build Classifier Pipeline (Gradient Boosting)
    clf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', GradientBoostingClassifier(
            n_estimators=120,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        ))
    ])
    
    # Build Regressor Pipeline
    reg_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.1,
            max_depth=4,
            random_state=42
        ))
    ])
    
    print("[SAATHI ML] Training Gradient Boosting Classifier...")
    clf_pipeline.fit(X_train, y_cat_train)
    
    print("[SAATHI ML] Training Gradient Boosting Regressor...")
    reg_pipeline.fit(X_train, y_reg_train)
    
    # Evaluation
    cat_preds = clf_pipeline.predict(X_test)
    reg_preds = reg_pipeline.predict(X_test)
    
    acc = accuracy_score(y_cat_test, cat_preds)
    r2 = r2_score(y_reg_test, reg_preds)
    rmse = np.sqrt(mean_squared_error(y_reg_test, reg_preds))
    
    print("\n" + "="*50)
    print("MODEL TRAINING RESULTS:")
    print(f"  * Classifier Accuracy: {acc * 100:.2f}%")
    print(f"  * Regressor R2 Score:   {r2:.4f}")
    print(f"  * Regressor RMSE:       {rmse:.4f}")
    print("="*50)
    print("\nClassification Report:\n", classification_report(
        y_cat_test, cat_preds, target_names=["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    ))
    
    # Feature Importances
    classifier = clf_pipeline.named_steps['classifier']
    importances = classifier.feature_importances_
    feat_imp = {feat: float(imp) for feat, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)}
    
    print("Feature Importances:")
    for feat, imp in feat_imp.items():
        print(f"  - {feat:30s}: {imp * 100:.2f}%")
    
    # Save Model Artifact
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "disaster_risk_model.joblib")
    meta_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_metadata.json")
    
    saved_bundle = {
        "clf_pipeline": clf_pipeline,
        "reg_pipeline": reg_pipeline,
        "feature_names": FEATURE_NAMES,
        "label_mapping": {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"},
        "metrics": {
            "accuracy": float(acc),
            "r2_score": float(r2),
            "rmse": float(rmse)
        },
        "feature_importances": feat_imp
    }
    
    joblib.dump(saved_bundle, model_path)
    print(f"\n[SUCCESS] Model bundle saved successfully to: {model_path}")
    
    with open(meta_path, "w") as f:
        json.dump({
            "model_type": "GradientBoostingClassifier + Regressor",
            "features": FEATURE_NAMES,
            "metrics": saved_bundle["metrics"],
            "feature_importances": feat_imp
        }, f, indent=2)
    print(f"[SUCCESS] Metadata saved to: {meta_path}\n")

if __name__ == "__main__":
    train_models()
