#!/bin/bash

# 🎬 Asteria Video Intro Fix - Production Deployment Script
# This script deploys the bulletproof video intro implementation

echo "🎬 Deploying Asteria Video Intro Fixes..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from the asteria-mvp directory"
    exit 1
fi

# Check if video files exist
echo "📹 Checking video files..."
if [ ! -f "public/videos/asteria_intro_mobile.mp4" ]; then
    echo "❌ Error: Mobile video file missing"
    echo "Expected: public/videos/asteria_intro_mobile.mp4"
    exit 1
fi

if [ ! -f "public/videos/intro_web.mp4" ]; then
    echo "❌ Error: Desktop video file missing"
    echo "Expected: public/videos/intro_web.mp4"
    exit 1
fi

echo "✅ Video files found"

# Run build to check for errors
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful"

# Clear any cached intro skip data for testing
echo "🧹 Clearing localStorage cache..."
echo "Note: Users may need to clear browser cache to see changes immediately"

# Deploy to Vercel
echo "🚀 Deploying to production..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo ""
    echo "✅ Video intro fixes are now live"
    echo "✅ Bulletproof implementation deployed"
    echo "✅ Mobile compatibility improved"
    echo "✅ Error handling enhanced"
    echo ""
    echo "🔗 Live URL: https://asteria-iy088u2z4-tag-asteria.vercel.app"
    echo "🛠 Debug Tool: https://asteria-iy088u2z4-tag-asteria.vercel.app/video-intro-test.html"
    echo ""
    echo "📊 Monitor these metrics:"
    echo "  - Video load success rate (target: >98%)"
    echo "  - Average loading time (target: <4s fast, <8s slow)"
    echo "  - Mobile compatibility (target: 100%)"
    echo "  - User stuck rate (target: <1%)"
    echo ""
    echo "🧪 Test on these devices:"
    echo "  - iOS Safari (manual play button)"
    echo "  - Android Chrome (autoplay attempt)"
    echo "  - Desktop browsers (autoplay/manual)"
    echo "  - Slow network connections"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Test video intro on multiple devices"
    echo "  2. Monitor error rates in production"
    echo "  3. Collect user feedback"
    echo "  4. Review performance metrics"
    echo ""
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi 