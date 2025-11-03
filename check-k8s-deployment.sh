#!/bin/bash

# Script to check Kubernetes deployment status

echo "=== Checking Kubernetes Deployment Status ==="
echo ""

echo "1. Checking if kubectl is available..."
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found"
    exit 1
fi
echo "✅ kubectl found"
echo ""

echo "2. Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi
echo "✅ Connected to cluster"
echo ""

echo "3. Checking namespace..."
kubectl get namespace l4h
echo ""

echo "4. Checking pods..."
kubectl get pods -n l4h
echo ""

echo "5. Checking deployments..."
kubectl get deployments -n l4h
echo ""

echo "6. Checking services..."
kubectl get services -n l4h
echo ""

echo "7. Checking ingress..."
kubectl get ingress -n l4h
kubectl describe ingress l4h-ingress -n l4h
echo ""

echo "8. Checking PVCs..."
kubectl get pvc -n l4h
echo ""

echo "9. Checking for pod errors..."
echo "Pods that are not Running:"
kubectl get pods -n l4h | grep -v "Running" | grep -v "NAME"
echo ""

echo "10. Checking recent pod logs (last 20 lines)..."
echo "=== API logs ==="
kubectl logs -n l4h -l app=api --tail=20 || echo "No API pods found"
echo ""
echo "=== Web logs ==="
kubectl logs -n l4h -l app=web --tail=20 || echo "No web pods found"
echo ""

echo "11. Checking Traefik ingress controller..."
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
echo ""

echo "Done!"
