// ==UserScript==
// @name         YouTube Custom Speed Controller (Up to 4x)
// @namespace    Violentmonkey Scripts
// @version      1.0
// @description  Adds keyboard shortcuts and an on-screen indicator to adjust YouTube video speed from 0.25x up to 4.0x.
// @author       Gemini
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const STEP = 0.25;
    const MIN_SPEED = 0.25;
    const MAX_SPEED = 4.0;

    // Create a visual indicator badge over the player
    const badge = document.createElement('div');
    badge.id = 'yt-custom-speed-badge';
    badge.style.position = 'fixed';
    badge.style.top = '70px';
    badge.style.right = '20px';
    badge.style.zIndex = '999999';
    badge.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    badge.style.color = '#fff';
    badge.style.padding = '6px 12px';
    badge.style.borderRadius = '6px';
    badge.style.fontSize = '14px';
    badge.style.fontFamily = 'Roboto, Arial, sans-serif';
    badge.style.fontWeight = 'bold';
    badge.style.pointerEvents = 'none';
    badge.style.transition = 'opacity 0.25s ease';
    badge.style.opacity = '0';
    document.body.appendChild(badge);

    let fadeTimeout = null;

    function showIndicator(speed) {
        badge.textContent = `${speed.toFixed(2)}x`;
        badge.style.opacity = '1';
        clearTimeout(fadeTimeout);
        fadeTimeout = setTimeout(() => {
            badge.style.opacity = '0';
        }, 1200);
    }

    function getVideo() {
        return document.querySelector('video');
    }

    function setPlaybackRate(rate) {
        const video = getVideo();
        if (!video) return;

        const clampedRate = Math.min(Math.max(rate, MIN_SPEED), MAX_SPEED);
        video.playbackRate = clampedRate;
        showIndicator(clampedRate);
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        // Prevent triggering while typing in comment boxes or the search bar
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isEditable = document.activeElement && document.activeElement.isContentEditable;
        if (activeTag === 'input' || activeTag === 'textarea' || isEditable) {
            return;
        }

        const video = getVideo();
        if (!video) return;

        // Press ']' to increase, '[' to decrease, or '\' to reset to 1.0x
        if (e.key === ']') {
            e.preventDefault();
            setPlaybackRate(video.playbackRate + STEP);
        } else if (e.key === '[') {
            e.preventDefault();
            setPlaybackRate(video.playbackRate - STEP);
        } else if (e.key === '\\') {
            e.preventDefault();
            setPlaybackRate(1.0);
        }
    });

    // Reapply speed if YouTube tries to reset it during ad transitions or video changes
    const observer = new MutationObserver(() => {
        const video = getVideo();
        if (video && !video.dataset.speedBound) {
            video.dataset.speedBound = 'true';
            video.addEventListener('ratechange', () => {
                // Ensure manual overrides persist if player tries to cap speed at 2x
                if (video.playbackRate > 2.0 && video.playbackRate <= MAX_SPEED) {
                    video.dataset.manualRate = video.playbackRate;
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
