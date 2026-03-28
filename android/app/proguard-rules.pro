# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ONNX Runtime - Fix crash in Release mode
-keep class ai.onnxruntime.** { *; }
-keep class com.microsoft.onnxruntime.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native FS (File System)
-keep class com.rnfs.** { *; }

# React Native Zip Archive
-keep class com.rnziparchive.** { *; }

# SQLite
-keep class org.pgsqlite.** { *; }
