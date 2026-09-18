#!/bin/bash
curl -i -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=$GEMINI_API_KEY" \
-H "Content-Type: application/json" \
-d '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
