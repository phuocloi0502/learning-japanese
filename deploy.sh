#!/bin/bash

echo "🚀 Starting deployment to Firebase..."

# Build production
echo "📦 Building for production..."
npm run build:prod

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Firebase
    echo "🔥 Deploying to Firebase..."
    npx firebase deploy --only hosting
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "🌐 Your app is now live at: https://jp-learning-angular.web.app"
    else
        echo "❌ Deployment failed!"
        echo "Please check Firebase //console and create project 'jp-learning-angular' first"
    fi
else
    echo "❌ Build failed!"
    echo "Please fix build errors before deploying"
fi
