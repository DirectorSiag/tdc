set OLDDIR=%CD%

cd %OLDDIR%\radar-app
electron main.js

chdir /d %OLDDIR% &rem restore current directory