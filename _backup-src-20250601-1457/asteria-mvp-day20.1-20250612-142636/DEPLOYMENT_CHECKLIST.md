# 🚀 Asteria Production Deployment Checklist

**Target Domain**: innercircle.thriveachievegrow.com  
**Deployment Date**: $(date +"%Y-%m-%d %H:%M:%S")  
**Version**: 1.0.0-mvp with 60FPS optimizations

## Pre-Deployment ✅
- [ ] GitHub backup complete
- [ ] Local build successful
- [ ] Video assets verified (240 desktop frames + 240 mobile frames)
- [ ] Environment variables documented
- [ ] All dependencies installed
- [ ] Vercel configuration created

## Video Assets Status 🎬
- [ ] Desktop frames: 240 frames verified in `/public/frames/desktop/`
- [ ] Mobile frames: 240 frames verified in `/public/frames/mobile/`
- [ ] Lite versions available for fallback
- [ ] Frame loading optimized for production

## Vercel Setup ⚙️
- [ ] Environment variables configured
- [ ] Domain settings verified (innercircle.thriveachievegrow.com)
- [ ] Build settings confirmed
- [ ] Framework preset: Next.js
- [ ] Function timeout: 30s
- [ ] Regions: IAD1 (US East)

## Environment Variables Required 🔑
- [ ] OPENAI_API_KEY (Required for AI responses)
- [ ] SLACK_WEBHOOK_URL (Required for admin notifications)
- [ ] ELEVENLABS_API_KEY (Optional - voice features)
- [ ] TWILIO_* (Optional - SMS features)
- [ ] TAVILY_API_KEY (Optional - web search)

## Post-Deployment Testing 🧪
- [ ] Health check passes: `/api/health`
- [ ] Environment check passes: `/api/env-check`
- [ ] Desktop video loads smoothly (240 frames @ 30fps)
- [ ] Mobile video loads optimally
- [ ] Chat interface responds
- [ ] API endpoints functioning
- [ ] Domain redirects correctly
- [ ] SSL certificate active

## Performance Targets 🎯
- [ ] Page load time < 3 seconds
- [ ] Video starts playing within 1 second
- [ ] No console errors
- [ ] Lighthouse score > 80
- [ ] Mobile responsive design
- [ ] Cross-browser compatibility

## Manual Testing Checklist 📱💻

### Desktop Testing
- [ ] Navigate to https://innercircle.thriveachievegrow.com
- [ ] Video intro plays smoothly (8 seconds, 240 frames)
- [ ] Skip button appears after 3 seconds
- [ ] Chat interface loads after video completion
- [ ] Can send message and receive AI response
- [ ] All UI elements properly styled
- [ ] No JavaScript errors in console

### Mobile Testing
- [ ] Open on mobile browser
- [ ] Mobile-optimized video plays correctly
- [ ] Touch interactions work smoothly
- [ ] Skip button is touch-friendly
- [ ] Chat interface is mobile responsive
- [ ] Virtual keyboard handling works
- [ ] Portrait orientation optimized

## Rollback Plan 🚨
If deployment issues occur:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Consider rolling back to previous deployment
5. Contact support if needed

## Success Criteria ✨
- ✅ Production URL accessible
- ✅ Video intro plays without errors
- ✅ AI chat functionality working
- ✅ Mobile and desktop responsive
- ✅ All API integrations functional
- ✅ Performance metrics met

---

**Deployment Status**: 🔄 In Progress  
**Last Updated**: $(date)  
**Deployed By**: Production Team 