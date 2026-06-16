#!/usr/bin/env bash

# Tag name for the temporary test image
IMAGE_NAME="hope-test-temp"

# Cleanup function to run on script exit (even if tests or build fail)
cleanup() {
    echo "----------------------------------------"
    echo "Cleaning up: Removing test Docker image '$IMAGE_NAME'..."
    docker rmi -f $IMAGE_NAME >/dev/null 2>&1
    echo "Cleanup complete."
    echo "----------------------------------------"
}
# Register the cleanup function to trigger on script exit
trap cleanup EXIT

echo "----------------------------------------"
echo "Building test Docker image '$IMAGE_NAME'..."
echo "----------------------------------------"
docker build -f Dockerfile.test -t $IMAGE_NAME .

echo ""
echo "----------------------------------------"
echo "Running pytest, ruff linter, and pip-audit in container..."
echo "----------------------------------------"
# Run the container. --rm automatically deletes the container when it exits.
docker run --rm $IMAGE_NAME
