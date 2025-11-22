#!/bin/bash

usage() {
    echo "Usage: $0 -l <local_file> | -u <url>"
    echo "  -l <local_file>  Play a local audio file"
    echo "  -u <url>         Download from URL and play"
    exit 1
}

while getopts "l:u:" opt; do
    case $opt in
        l)
            LOCAL_FILE="$OPTARG"
            ;;
        u)
            URL="$OPTARG"
            ;;
        *)
            usage
            ;;
    esac
done

if [ -n "$LOCAL_FILE" ]; then
    /mnt/us/extensions/sox/playfile.sh "$LOCAL_FILE"
elif [ -n "$URL" ]; then
    curl "$URL" \
      -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
      -o '/tmp/output.mp3'
    /mnt/us/extensions/sox/playfile.sh /tmp/output.mp3
else
    echo "Error: You must specify either a local file or a URL."
    usage
fi