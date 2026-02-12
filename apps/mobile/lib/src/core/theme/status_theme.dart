import 'package:flutter/material.dart';

Color statusColor(String status, ColorScheme scheme) {
  switch (status) {
    case "requested":
      return scheme.secondary;
    case "accepted":
      return scheme.primary;
    case "enroute":
      return Colors.blue;
    case "started":
      return Colors.indigo;
    case "completed":
      return Colors.green;
    case "paid":
      return Colors.teal;
    case "cancelled":
      return scheme.error;
    default:
      return scheme.outline;
  }
}
