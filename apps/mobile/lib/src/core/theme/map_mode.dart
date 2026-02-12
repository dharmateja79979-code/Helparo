enum MapMode { google, osm }

MapMode mapModeFromEnv(String? value) {
  if ((value ?? "").toLowerCase() == "google") return MapMode.google;
  return MapMode.osm;
}
