import 'package:flutter/material.dart';
import 'app_tokens.dart';

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.surface,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brand,
      primary: AppColors.brand,
      secondary: AppColors.accent,
    ),
    textTheme: const TextTheme(
      bodySmall: TextStyle(fontSize: AppTypography.xs),
      bodyMedium: TextStyle(fontSize: AppTypography.sm),
      bodyLarge: TextStyle(fontSize: AppTypography.md),
      titleMedium: TextStyle(fontSize: AppTypography.lg, fontWeight: FontWeight.w700),
      titleLarge: TextStyle(fontSize: AppTypography.xl, fontWeight: FontWeight.w700),
    ),
    cardTheme: const CardThemeData(
      color: AppColors.card,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.md),
    ),
  );
}
