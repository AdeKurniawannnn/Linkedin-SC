#!/bin/bash
set -e

echo "🔧 Setting up workspace..."

# Symlink .env file from repository root
if [ -f "$CONDUCTOR_ROOT_PATH/.env" ]; then
    echo "📄 Symlinking .env from repository root..."

    # Remove existing .env if it exists (file or symlink)
    if [ -e ".env" ] || [ -L ".env" ]; then
        rm -f ".env"
    fi

    # Create symlink
    ln -s "$CONDUCTOR_ROOT_PATH/.env" .env
    echo "✅ .env symlinked successfully"
else
    echo "⚠️  Warning: $CONDUCTOR_ROOT_PATH/.env not found"
    echo "   Please ensure a .env file exists at the repository root"
    exit 1
fi

echo "✅ Workspace setup complete"
