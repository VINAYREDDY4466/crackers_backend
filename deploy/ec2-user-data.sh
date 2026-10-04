#!/bin/bash
# EC2 first-boot setup for Ubuntu 24.04.
# Paste into: EC2 > Launch instance > Advanced details > User data.
# Progress log on the server: /var/log/cloud-init-output.log
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

APP_USER=ubuntu

apt-get update -y
apt-get install -y curl ca-certificates git nginx certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
