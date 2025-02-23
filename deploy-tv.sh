#!/bin/bash

# Check if TV IP is provided
if [ -z "$1" ]; then
    echo "Please provide your TV's IP address"
    echo "Usage: ./deploy-tv.sh YOUR_TV_IP"
    exit 1
fi

TV_IP="$1"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists tizen; then
    echo "Error: Tizen CLI not found. Please ensure Tizen Studio CLI is installed and in your PATH"
    echo "Add this to your ~/.zshrc or ~/.bashrc:"
    echo "export PATH=\$PATH:~/tizen/tools/ide/bin"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm not found. Please install Node.js and npm"
    exit 1
fi

# Create config.xml if it doesn't exist
echo "📝 Creating Tizen configuration..."
cat > public/tizen-config.xml << EOL
<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" id="http://yourdomain/ReactTVGame" version="1.0.0" viewmodes="maximized">
    <tizen:application id="1234567890.ReactTVGame" package="1234567890" required_version="2.3"/>
    <content src="index.html"/>
    <feature name="http://tizen.org/feature/screen.size.all"/>
    <icon src="logo512.png"/>
    <name>ReactTVGame</name>
    <tizen:privilege name="http://tizen.org/privilege/application.launch"/>
    <tizen:privilege name="http://tizen.org/privilege/tv.inputdevice"/>
    <tizen:profile name="tv-samsung"/>
    <tizen:setting screen-orientation="landscape" context-menu="enable" background-support="disable" encryption="disable" install-location="auto" hwkey-event="enable"/>
    <access origin="*" subdomains="true"/>
</widget>
EOL

echo "🔨 Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Copy config to build directory
cp public/tizen-config.xml build/config.xml

echo "🔄 Restarting SDB server..."
~/tizen/tools/sdb kill-server
~/tizen/tools/sdb start-server

echo "🔌 Connecting to TV at $TV_IP..."
~/tizen/tools/sdb connect $TV_IP

# Check if connection was successful
if ! ~/tizen/tools/sdb devices | grep -q $TV_IP; then
    echo "❌ Failed to connect to TV. Please check:"
    echo "  1. TV is turned on and on the same network"
    echo "  2. Developer Mode is enabled on the TV"
    echo "  3. IP address is correct"
    exit 1
fi

echo "📦 Packaging app..."
cd build
tizen package -t wgt -s MyTVProfile -- .

if [ $? -ne 0 ]; then
    echo "❌ Packaging failed"
    exit 1
fi

echo "📲 Installing app on TV..."
tizen install -s $TV_IP:26101 -n ReactTVGame.wgt

if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    echo "Try these troubleshooting steps:"
    echo "1. Turn off Developer Mode on TV"
    echo "2. Restart TV"
    echo "3. Turn Developer Mode back on"
    echo "4. Run this script again"
    exit 1
fi

echo "✅ Deployment complete!"
echo "You should now see 'ReactTVGame' in your TV's apps list" 