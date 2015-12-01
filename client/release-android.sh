mkdir -p release
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $ED_KEYSTORE_FILE platforms/android/build/outputs/apk/android-release-unsigned.apk $ED_KEYSTORE_ALIAS
rm -f release/android.apk
zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk release/android.apk
