class AppEnv {
  static const String apiBaseUrl =
      String.fromEnvironment("API_BASE_URL", defaultValue: "http://10.0.2.2:8080");
  static const String supabaseUrl =
      String.fromEnvironment("SUPABASE_URL", defaultValue: "");
  static const String supabaseAnonKey =
      String.fromEnvironment("SUPABASE_ANON_KEY", defaultValue: "");
  static const String googleMapsApiKey =
      String.fromEnvironment("GOOGLE_MAPS_API_KEY", defaultValue: "");
}
