#!/usr/bin/env bash

ZIPFILE=("Consultazione2021.zip" "Consultazione2021_bianche2016.zip" "Bando1Giga-v1.zip" "Bando1Giga_TN_BZ-v2.zip")
DOWNLOAD_URL="https://media.githubusercontent.com/media/HandyMenny/database-infratel/main/"
DIR=("csv/Consultazione2021" "csv/Consultazione2021Bianche"  "csv/Bando1Giga"  "csv/Bando1Giga")

if ! command -v wget &>/dev/null; then
  echo "wget is not found on the system, you must install it to execute this script"
  exit 1
fi

if ! command -v unzip &>/dev/null; then
  echo "unzip is not found on the system, you must install it to execute this script"
  exit 1
fi

function download_extract() {
  wget "$2$1" -P $3/
  while [ `ls -1 $3/*.zip 2>/dev/null | wc -l` != 0 ]
  do
    for file in $3/*.zip
    do
      unzip -jo "$file" -d $3/
      rm "$file"
    done
  done
  find $3/ ! -iname "*.csv" -type f -delete
  rm -f $3/header.csv
}


length=${#ZIPFILE[@]}
for (( i=0; i<length; i++ ));
do
  download_extract ${ZIPFILE[$i]} $DOWNLOAD_URL ${DIR[$i]}
done

