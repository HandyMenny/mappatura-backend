#!/usr/bin/env bash

ZIPFILE="allegatoa_wired_regioni.zip"
DOWNLOAD_URL="https://www.infratelitalia.it/-/media/infratel/documents/"$ZIPFILE""
DIR="csv/Consultazione2021"

if ! command -v wget &>/dev/null; then
  echo "wget is not found on the system, you must install it to execute this script"
  exit 1
fi

if ! command -v unzip &>/dev/null; then
  echo "unzip is not found on the system, you must install it to execute this script"
  exit 1
fi

wget "$DOWNLOAD_URL" -P $DIR/
unzip -o $DIR/\* -d $DIR/
rm -rf $DIR/*.xlsx
rm -rf $DIR/"$ZIPFILE"
unzip -o $DIR/\* -d $DIR/
rm -rf $DIR/*.zip
