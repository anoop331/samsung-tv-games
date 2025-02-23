# React TV Game

A React-based game developed for Samsung Smart TVs using the Tizen platform.

## Prerequisites

1. Install Tizen Studio CLI
   - Download Tizen Studio CLI from [Samsung Developers](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)
   - Choose "Tizen Studio 6.0 with CLI installer"
   - Install it to your home directory (`~/tizen`)

2. Samsung TV Setup
   - Enable Developer Mode on your TV:
     1. Go to Apps
     2. Press 1, 2, 3, 4, 5 in sequence on your remote
     3. Enable Developer Mode when prompted
     4. The TV will restart
   - After restart:
     1. Go to Settings > System > About
     2. Note your TV's IP address
     3. In Developer Mode settings, set the Host IP to your computer's IP address

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Building and Deploying

### Manual Steps

1. Build the React app:
```bash
npm run build:tv
```

2. Connect to your TV:
```bash
~/tizen/tools/sdb connect YOUR_TV_IP
```

3. Create certificate (first time only):
```bash
tizen certificate -a MyTVCert -p 1234 -c US -s California -ct "Development" -n "My TV App" -e "dev@example.com" -f MyTVCert
tizen security-profiles add -n MyTVProfile -a ~/tizen-data/keystore/author/MyTVCert.p12 -p 1234
tizen cli-config "profiles.path=~/tizen-data/profile/profiles.xml"
```

4. Package and install:
```bash
cd build
tizen package -t wgt -s MyTVProfile -- .
tizen install -s YOUR_TV_IP:26101 -n ReactTVGame.wgt
```

### Automated Deployment

You can use the provided deployment script:
```bash
./deploy-tv.sh YOUR_TV_IP
```

## Controls

- Use Arrow Keys for navigation
- Enter/Return to select
- Back button to return to previous screen

## Troubleshooting

1. If installation fails:
   - Turn off Developer Mode
   - Restart TV
   - Turn Developer Mode back on
   - Try deployment again

2. If app doesn't appear:
   - Check TV's Apps section
   - Verify both TV and computer are on the same network
   - Ensure Host IP is set correctly in TV's developer settings

3. Connection issues:
   - Verify TV's IP address
   - Check network connectivity
   - Restart the SDB server using `~/tizen/tools/sdb kill-server && ~/tizen/tools/sdb start-server`
