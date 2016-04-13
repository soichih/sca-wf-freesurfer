m2 delete freesurfer
pm2 start api/freesurfer.js --watch --ignore-watch="\.log \.git \.sh bin ui test"
pm2 save

