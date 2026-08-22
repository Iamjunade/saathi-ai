"""
SAATHI Disaster Risk Model - Model Evaluation & Benchmarks
"""

import os
import time
import joblib
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, r2_score
from train_disaster_model import generate_synthetic_dataset, FEATURE_NAMES

def run_evaluation():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "disaster_risk_model.joblib")
    
    if not os.path.exists(model_path):
        print(f"[!] Model artifact not found at {model_path}. Running training first...")
        from train_disaster_model import train_models
        train_models()
        
    print("[SAATHI ML] Loading trained model bundle...")
    bundle = joblib.load(model_path)
    clf_pipeline = bundle["clf_pipeline"]
    reg_pipeline = bundle["reg_pipeline"]
    
    print("[SAATHI ML] Generating 1,500 unseen validation samples...")
    test_df = generate_synthetic_dataset(n_samples=1500, random_state=999)
    X = test_df[FEATURE_NAMES]
    y_cat = test_df["risk_category"]
    y_reg = test_df["risk_score"]
    
    # Latency benchmark
    start_time = time.perf_counter()
    y_cat_pred = clf_pipeline.predict(X)
    y_reg_pred = reg_pipeline.predict(X)
    total_time_ms = (time.perf_counter() - start_time) * 1000
    avg_latency_ms = total_time_ms / len(X)
    
    acc = accuracy_score(y_cat, y_cat_pred)
    r2 = r2_score(y_reg, y_reg_pred)
    
    print("\n" + "="*60)
    print("SAATHI DISASTER MODEL BENCHMARK RESULTS")
    print("="*60)
    print(f" * Categorical Classification Accuracy: {acc * 100:.2f}%")
    print(f" * Continuous Risk Score R2:            {r2:.4f}")
    print(f" * Average Inference Latency:           {avg_latency_ms:.4f} ms / sample ({1000/avg_latency_ms:.0f} req/sec)")
    print("="*60)
    
    print("\nConfusion Matrix (Rows: Actual, Cols: Predicted):")
    cm = confusion_matrix(y_cat, y_cat_pred)
    print("        LOW   MED  HIGH  CRIT")
    labels = ["LOW ", "MED ", "HIGH", "CRIT"]
    for i, row in enumerate(cm):
        print(f" {labels[i]}: {row[0]:5d} {row[1]:5d} {row[2]:5d} {row[3]:5d}")
        
    print("\nDetailed Classification Metrics:")
    print(classification_report(y_cat, y_cat_pred, target_names=["LOW", "MEDIUM", "HIGH", "CRITICAL"]))

if __name__ == "__main__":
    run_evaluation()
