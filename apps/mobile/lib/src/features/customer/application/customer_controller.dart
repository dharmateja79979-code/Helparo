import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../data/customer_repository.dart';
import '../domain/address.dart';
import '../domain/category.dart';
import '../domain/helper_profile.dart';
import '../domain/zone.dart';

final customerRepositoryProvider =
    Provider<CustomerRepository>((ref) => CustomerRepository(ref.read(apiClientProvider)));

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  return ref.watch(customerRepositoryProvider).getCategories();
});

final helpersProvider =
    FutureProvider.family<List<HelperProfileSummary>, String>((ref, categoryId) async {
  return ref.watch(customerRepositoryProvider).getHelpers(categoryId: categoryId);
});

final addressesProvider = FutureProvider<List<AddressItem>>((ref) async {
  return ref.watch(customerRepositoryProvider).getAddresses();
});

final zonesProvider = FutureProvider<List<Zone>>((ref) async {
  return ref.watch(customerRepositoryProvider).getZones();
});
