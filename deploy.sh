echo "start deploy"

npm run build

aws cloudfront create-invalidation --distribution-id E13Z16GQRD7R2Z --paths "/*"

aws s3 sync --exclude "*.map" --delete ./build s3://dalkong-cam

echo "==finished=="