#!/usr/bin/env bash

ZIPFILE=("Consultazione2024.tar.xz", "Consultazione2021.tar.xz" "Consultazione2021_bianche2016.tar.xz" "Bando1Giga-v1.tar.xz" "Bando1Giga_TN_BZ-v2.tar.xz" "Consultazione2020.tar.xz" "Consultazione2019.tar.xz" "Consultazione2017_update2018.tar.xz" "Consultazione2017_bianche.tar.xz")
DOWNLOAD_URL="https://media.githubusercontent.com/media/HandyMenny/database-infratel/main/"
DIR=("csv/Consultazione2024", "csv/Consultazione2021" "csv/Consultazione2021Bianche"  "csv/Bando1Giga"  "csv/Bando1Giga" "csv/Consultazione2020" "csv/Consultazione2019" "csv/Consultazione2017" "csv/Consultazione2017Bianche")

if ! command -v wget &>/dev/null; then
  echo "wget is not found on the system, you must install it to execute this script"
  exit 1
fi

if ! command -v tar &>/dev/null; then
  echo "tar is not found on the system, you must install it to execute this script"
  exit 1
fi

function download_extract() {
  wget "$2$1" -P $3/
  tar xf $3/$1 --transform='s/.*\///' --directory $3/
  find $3/ -mindepth 1 ! -iname "*.csv" -delete
  rm -f $3/header.csv
}


length=${#ZIPFILE[@]}
for (( i=0; i<length; i++ ));
do
  download_extract ${ZIPFILE[$i]} $DOWNLOAD_URL ${DIR[$i]}
done

