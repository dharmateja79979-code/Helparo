import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:helparo_mobile/src/app/app.dart';

void main() {
  testWidgets('App bootstraps', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: HelparoApp()));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
