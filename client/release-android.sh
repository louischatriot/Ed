# Switch configuration to production environment
cp www/config.js www/config.js.bckp
echo "var env='prod';" > www/env
cat www/env www/config.js > www/config.js.new
rm www/config.js
rm www/env
mv www/config.js.new www/config.js

mkdir -p release
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $ED_KEYSTORE_FILE platforms/android/build/outputs/apk/android-release-unsigned.apk $ED_KEYSTORE_ALIAS
rm -f release/android.apk
zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk release/android.apk

# Back to dev environment
rm www/config.js
mv www/config.js.bckp www/config.js
