#!/bin/bash
# ============================================================
# CastNode — Proxmox Host Setup Script
# Run this on the Proxmox VE host (NOT inside a container)
# ============================================================
set -e

CTID=100
HOSTNAME="castnode"
CORES=4
MEMORY=8192
SWAP=4096
DISK=40
BRIDGE="vmbr0"

echo "=== CastNode Proxmox LXC Setup ==="
echo "Container ID: $CTID"
echo "Specs: ${CORES} vCPU / ${MEMORY}MB RAM / ${DISK}GB disk"
echo ""

# Step 1: Download Ubuntu 24.04 template
echo "[1/3] Downloading Ubuntu 24.04 template..."
pveam update
TEMPLATE=$(pveam available --section system | grep ubuntu-24.04 | head -1 | awk '{print $2}')
if [ -z "$TEMPLATE" ]; then
    echo "ERROR: Ubuntu 24.04 template not found. Check available templates with: pveam available --section system"
    exit 1
fi
pveam download local "$TEMPLATE" || true  # OK if already downloaded

# Step 2: Create the container
echo "[2/3] Creating LXC container..."
pct create $CTID "local:vztmpl/$TEMPLATE" \
    --hostname "$HOSTNAME" \
    --cores $CORES \
    --memory $MEMORY \
    --swap $SWAP \
    --storage local-lvm \
    --rootfs "local-lvm:$DISK" \
    --net0 "name=eth0,bridge=$BRIDGE,ip=dhcp" \
    --features nesting=1,keyctl=1 \
    --unprivileged 1 \
    --start 1

echo "[3/3] Waiting for container to boot..."
sleep 5

echo ""
echo "=== Container created successfully ==="
echo ""
echo "Next steps:"
echo "  1. Enter the container:  pct enter $CTID"
echo "  2. Run the setup script: bash /root/container-setup.sh"
echo ""
echo "To push the setup script into the container:"
echo "  pct push $CTID /path/to/container-setup.sh /root/container-setup.sh"
echo ""
