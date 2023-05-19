echo "start deploy"

npm run build

aws s3 cp --recursive ./build s3://dalkong-cam

echo "==finished=="