# Add both platforms even if machine can only build on one
cordova platform add android
cordova platform add ios

# Common configuration regardless of platform build
cordova plugin add org.apache.cordova.device
cordova plugin add org.apache.cordova.console
