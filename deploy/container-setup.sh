#!/bin/bash
# ============================================================
# CastNode — Container Setup Script
# Run this INSIDE the LXC container (pct enter 100)
# ============================================================
set -e

REPO_URL="https://github.com/whereswallen/Podcast.git"
DEPLOY_USER="castnode"
DOMAIN="castnode.ai"

echo "=== CastNode Container Setup ==="
echo ""

# ---- Step 1: System packages ----
echo "[1/6] Installing system packages..."
apt update && apt upgrade -y
apt install -y \
    curl wget git sudo nano htop unzip \
    ca-certificates gnupg lsb-release \
    build-essential libpq-dev ffmpeg \
    python3 python3-pip python3-venv \
    debian-keyring debian-archive-keyring apt-transport-https

# ---- Step 2: Docker ----
echo "[2/6] Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker run --rm hello-world && echo "Docker OK"

# ---- Step 3: Node.js + Claude Code CLI ----
echo "[3/6] Installing Node.js 22 and Claude Code CLI..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g @anthropic-ai/claude-code
echo "Node $(node --version) | npm $(npm --version) | Claude Code $(claude --version 2>/dev/null || echo 'installed')"

# ---- Step 4: Create deploy user ----
echo "[4/6] Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# ---- Step 5: Clone and configure ----
echo "[5/6] Cloning CastNode repo..."
su - "$DEPLOY_USER" -c "
    git clone $REPO_URL ~/castnode 2>/dev/null || (cd ~/castnode && git pull)
    cd ~/castnode
    cp -n backend/.env.example backend/.env

    # Generate a real secret key
    SECRET=\$(openssl rand -hex 32)
    sed -i \"s/change-me-in-production-use-a-real-secret-key/\$SECRET/\" backend/.env

    # Update URLs for Docker internal networking (these are already correct in .env.example)
    echo ''
    echo '=== IMPORTANT: Edit backend/.env with your API keys ==='
    echo 'File: /home/$DEPLOY_USER/castnode/backend/.env'
    echo ''
    echo 'MUST SET:'
    echo '  ANTHROPIC_API_KEY=sk-ant-...'
    echo ''
    echo 'OPTIONAL:'
    echo '  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (for OAuth)'
    echo '  GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (for OAuth)'
    echo '  STRIPE_SECRET_KEY (for payments)'
    echo ''
"

# ---- Step 6: Install Caddy reverse proxy ----
echo "[6/6] Installing Caddy reverse proxy..."
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

cat > /etc/caddy/Caddyfile << EOF
$DOMAIN {
    handle /api/* {
        reverse_proxy localhost:8000
    }
    handle /media/* {
        reverse_proxy localhost:8000
    }
    reverse_proxy localhost:3000
}
EOF

systemctl enable caddy

echo ""
echo "============================================"
echo "  CastNode setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit the .env file:"
echo "     nano /home/$DEPLOY_USER/castnode/backend/.env"
echo ""
echo "  2. Point DNS: $DOMAIN → your server IP"
echo ""
echo "  3. Start the app:"
echo "     su - $DEPLOY_USER"
echo "     cd ~/castnode"
echo "     docker compose up -d --build"
echo ""
echo "  4. Start Caddy (after DNS is set):"
echo "     systemctl restart caddy"
echo ""
echo "  5. Verify:"
echo "     curl http://localhost:8000/api/health"
echo "     curl http://localhost:3000"
echo ""
echo "  6. Use Claude Code for development:"
echo "     su - $DEPLOY_USER"
echo "     cd ~/castnode"
echo "     claude"
echo ""
