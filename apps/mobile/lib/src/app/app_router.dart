import 'package:go_router/go_router.dart';
import '../features/auth/login_screen.dart';
import '../features/booking/customer_home_screen.dart';
import '../features/customer/presentation/booking_create_screen.dart';
import '../features/customer/presentation/booking_tracking_screen.dart';
import '../features/customer/presentation/categories_screen.dart';
import '../features/customer/presentation/helper_list_screen.dart';
import '../features/customer/presentation/helper_profile_screen.dart';
import '../features/customer/presentation/advanced_features_screen.dart';
import '../features/customer/presentation/ai_estimate_screen.dart';
import '../features/customer/presentation/corporate_screen.dart';
import '../features/customer/presentation/dispute_screen.dart';
import '../features/customer/presentation/location_zone_screen.dart';
import '../features/customer/presentation/premium_screen.dart';
import '../features/customer/presentation/profile_addresses_screen.dart';
import '../features/customer/presentation/review_screen.dart';
import '../features/helper/helper_home_screen.dart';
import '../features/helper/presentation/helper_earnings_screen.dart';
import '../features/helper/presentation/helper_job_details_screen.dart';
import '../features/helper/presentation/helper_jobs_screen.dart';
import '../features/helper/presentation/helper_onboarding_screen.dart';
import '../features/shared/splash_screen.dart';

final appRouter = GoRouter(
  initialLocation: "/",
  routes: [
    GoRoute(path: "/", builder: (_, __) => const SplashScreen()),
    GoRoute(path: "/login", builder: (_, __) => const LoginScreen()),
    GoRoute(path: "/customer", builder: (_, __) => const CustomerHomeScreen()),
    GoRoute(
        path: "/customer/location",
        builder: (_, __) => const LocationZoneScreen()),
    GoRoute(
        path: "/customer/categories",
        builder: (_, __) => const CategoriesScreen()),
    GoRoute(
      path: "/customer/helpers",
      builder: (_, state) => HelperListScreen(
        categoryId: state.uri.queryParameters["categoryId"] ?? "",
        categoryName: state.uri.queryParameters["categoryName"] ?? "Cleaning",
      ),
    ),
    GoRoute(
      path: "/customer/helper/:id",
      builder: (_, state) => HelperProfileScreen(
        helperId: state.pathParameters["id"] ?? "",
        categoryId: state.uri.queryParameters["categoryId"] ?? "",
        categoryName: state.uri.queryParameters["categoryName"] ?? "Cleaning",
      ),
    ),
    GoRoute(
      path: "/customer/booking/create",
      builder: (_, state) => BookingCreateScreen(
        categoryId: state.uri.queryParameters["categoryId"] ?? "",
        categoryName: state.uri.queryParameters["categoryName"] ?? "Cleaning",
        helperId: state.uri.queryParameters["helperId"] ?? "",
      ),
    ),
    GoRoute(
      path: "/customer/booking/track",
      builder: (_, state) => BookingTrackingScreen(
        bookingId: state.uri.queryParameters["id"] ?? "sample-1",
      ),
    ),
    GoRoute(
      path: "/customer/review",
      builder: (_, state) => ReviewScreen(
        bookingId: state.uri.queryParameters["bookingId"] ?? "sample-1",
      ),
    ),
    GoRoute(
        path: "/customer/profile",
        builder: (_, __) => const ProfileAddressesScreen()),
    GoRoute(
        path: "/customer/features",
        builder: (_, __) => const AdvancedFeaturesScreen()),
    GoRoute(
        path: "/customer/features/dispute",
        builder: (_, __) => const DisputeScreen()),
    GoRoute(
        path: "/customer/features/premium",
        builder: (_, __) => const PremiumScreen()),
    GoRoute(
        path: "/customer/features/corporate",
        builder: (_, __) => const CorporateScreen()),
    GoRoute(
        path: "/customer/features/ai-estimate",
        builder: (_, __) => const AiEstimateScreen()),
    GoRoute(path: "/helper", builder: (_, __) => const HelperHomeScreen()),
    GoRoute(
        path: "/helper/onboarding",
        builder: (_, __) => const HelperOnboardingScreen()),
    GoRoute(path: "/helper/jobs", builder: (_, __) => const HelperJobsScreen()),
    GoRoute(
      path: "/helper/job/:id",
      builder: (_, state) =>
          HelperJobDetailsScreen(bookingId: state.pathParameters["id"] ?? ""),
    ),
    GoRoute(
        path: "/helper/earnings",
        builder: (_, __) => const HelperEarningsScreen()),
  ],
);
