echo "start deploy"

npm run build

aws cloudfront create-invalidation --distribution-id E32O71CQPIW6VN --paths "/*"

aws s3 sync --exclude "*.map" --delete ./build s3://dalkong-cam

echo "==finished=="