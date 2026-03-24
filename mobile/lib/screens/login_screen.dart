import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberMe = false;
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;

  // Colores profesionales
  static const Color primaryColor = Color(0xFFE0115F);
  static const Color accentColor = Color(0xFFD4AF37);
  static const Color backgroundColor = Color(0xFF0A0A0A);
  static const Color surfaceColor = Color(0xFF1A1A1A);
  static const Color textColor = Colors.white;
  static const Color errorColor = Color(0xFFFF5252);
  static const Color successColor = Color(0xFF4CAF50);

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _setupSystemUI();
    _loadSavedCredentials(); // Cargar credenciales guardadas
  }

  void _setupAnimations() {
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.2, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );
    
    _animationController.forward();
  }

  void _setupSystemUI() {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: backgroundColor,
      systemNavigationBarIconBrightness: Brightness.light,
    ));
  }

  // Cargar credenciales guardadas
  Future<void> _loadSavedCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedEmail = prefs.getString('saved_email') ?? '';
      final savedPassword = prefs.getString('saved_password') ?? '';
      final rememberMe = prefs.getBool('remember_me') ?? false;

      if (rememberMe && savedEmail.isNotEmpty) {
        setState(() {
          _emailController.text = savedEmail;
          _passwordController.text = savedPassword;
          _rememberMe = rememberMe;
        });
      }
    } catch (e) {
      print('Error loading saved credentials: $e');
    }
  }

  // Guardar credenciales
  Future<void> _saveCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      if (_rememberMe) {
        await prefs.setString('saved_email', _emailController.text.trim());
        await prefs.setString('saved_password', _passwordController.text);
        await prefs.setBool('remember_me', true);
      } else {
        // Si no quiere recordar, limpiar datos guardados
        await prefs.remove('saved_email');
        await prefs.remove('saved_password');
        await prefs.setBool('remember_me', false);
      }
    } catch (e) {
      print('Error saving credentials: $e');
    }
  }

  // Limpiar credenciales guardadas
  Future<void> _clearSavedCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_email');
      await prefs.remove('saved_password');
      await prefs.setBool('remember_me', false);
    } catch (e) {
      print('Error clearing credentials: $e');
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  // Validaciones mejoradas
  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Por favor ingresa tu correo electrónico';
    }
    final emailRegExp = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegExp.hasMatch(value)) {
      return 'Ingresa un correo electrónico válido';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Por favor ingresa tu contraseña';
    }
    if (value.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _isLoading = true;
    });

    // Agregar vibración táctil
    HapticFeedback.lightImpact();

    const String url = 'https://gitbf.onrender.com/api/auth/login';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      setState(() {
        _isLoading = false;
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final token = data['token'];
        
        // Guardar credenciales si el login es exitoso
        await _saveCredentials();
        
        HapticFeedback.mediumImpact();
        _showSuccessDialog(token);
      } else {
        HapticFeedback.heavyImpact();
        _handleLoginError(response.statusCode);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      HapticFeedback.heavyImpact();
      _showErrorDialog('Error de conexión', 'No se pudo conectar al servidor. Verifica tu conexión a internet');
    }
  }

  void _handleLoginError(int statusCode) {
    switch (statusCode) {
      case 401:
        _showErrorDialog('Credenciales inválidas', 'El correo o la contraseña son incorrectos');
        break;
      case 429:
        _showErrorDialog('Demasiados intentos', 'Has excedido el límite de intentos. Inténtalo más tarde');
        break;
      case 500:
        _showErrorDialog('Error del servidor', 'Problema interno del servidor. Inténtalo más tarde');
        break;
      default:
        _showErrorDialog('Error de inicio de sesión', 'No se pudo iniciar sesión. Inténtalo de nuevo');
    }
  }

  void _showSuccessDialog(String token) {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.success,
      animType: AnimType.scale,
      title: 'Inicio exitoso',
      titleTextStyle: const TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 22,
        color: Color(0xFF1A1A1A),
        fontFamily: 'SF Pro Display',
      ),
      desc: '¡Bienvenido de nuevo!',
      descTextStyle: const TextStyle(
        fontSize: 16,
        fontFamily: 'SF Pro Text',
      ),
      btnOkColor: primaryColor,
      btnOkOnPress: () {
        Navigator.pushReplacementNamed(context, '/dashboard', arguments: token);
      },
      dismissOnTouchOutside: false,
      dismissOnBackKeyPress: false,
    ).show();
  }

  void _showErrorDialog(String title, String message) {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.error,
      animType: AnimType.scale,
      title: title,
      titleTextStyle: const TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 22,
        color: Color(0xFF1A1A1A),
        fontFamily: 'SF Pro Display',
      ),
      desc: message,
      descTextStyle: const TextStyle(
        fontSize: 16,
        fontFamily: 'SF Pro Text',
      ),
      btnOkOnPress: () {},
      btnOkColor: primaryColor,
    ).show();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topCenter,
            radius: 2.0,
            colors: [
              Color(0xFF1A1A1A),
              Color(0xFF0A0A0A),
              Color(0xFF000000),
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Patrón de fondo sutil
              _buildBackgroundPattern(),
              
              // Contenido principal
              SlideTransition(
                position: _slideAnimation,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Center(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Logo animado
                              ScaleTransition(
                                scale: _scaleAnimation,
                                child: _buildAnimatedLogo(),
                              ),
                              
                              const SizedBox(height: 40),
                              
                              // Título elegante
                              _buildWelcomeText(),
                              
                              const SizedBox(height: 40),
                              
                              // Campo de email
                              _buildEmailField(),
                              
                              const SizedBox(height: 20),
                              
                              // Campo de contraseña
                              _buildPasswordField(),
                              
                              const SizedBox(height: 8),
                              
                              // Recordarme
                              _buildRememberMeCheckbox(),
                              
                              const SizedBox(height: 30),
                              
                              // Botón de login
                              _buildLoginButton(),
                              
                              const SizedBox(height: 50),
                              
                              // Footer elegante
                              _buildFooter(),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              
              // Decoraciones de esquina
              ..._buildCornerDecorations(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackgroundPattern() {
    return Positioned.fill(
      child: Opacity(
        opacity: 0.02,
        child: Container(
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: AssetImage('images/logo1.png'),
              repeat: ImageRepeat.repeat,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAnimatedLogo() {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: const Duration(seconds: 2),
      builder: (context, value, child) {
        return Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [
                accentColor.withOpacity(0.3),
                accentColor.withOpacity(0.1),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: accentColor.withOpacity(0.3 * value),
                blurRadius: 30 * value,
                spreadRadius: 5 * value,
              ),
            ],
          ),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: accentColor,
                width: 2,
              ),
            ),
            child: CircleAvatar(
              radius: 50,
              backgroundColor: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Image.asset(
                  'images/logo1.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildWelcomeText() {
    return Column(
      children: [
        Text(
          "¡Bienvenido de nuevo!",
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
            color: textColor,
            fontFamily: 'SF Pro Display',
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          "Inicia sesión para continuar",
          style: TextStyle(
            fontSize: 16,
            color: accentColor,
            letterSpacing: 0.5,
            fontWeight: FontWeight.w300,
            fontFamily: 'SF Pro Text',
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildEmailField() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextFormField(
        controller: _emailController,
        style: const TextStyle(
          color: textColor,
          fontSize: 16,
          fontFamily: 'SF Pro Text',
        ),
        decoration: InputDecoration(
          hintText: 'Correo electrónico',
          hintStyle: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontFamily: 'SF Pro Text',
          ),
          prefixIcon: Icon(
            Icons.email_outlined,
            color: accentColor,
            size: 22,
          ),
          filled: true,
          fillColor: surfaceColor.withOpacity(0.8),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 20,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: accentColor, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: errorColor, width: 1),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: errorColor, width: 2),
          ),
          errorStyle: const TextStyle(
            color: errorColor,
            fontSize: 12,
            fontFamily: 'SF Pro Text',
          ),
        ),
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        validator: _validateEmail,
        autovalidateMode: AutovalidateMode.onUserInteraction,
      ),
    );
  }

  Widget _buildPasswordField() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextFormField(
        controller: _passwordController,
        style: const TextStyle(
          color: textColor,
          fontSize: 16,
          fontFamily: 'SF Pro Text',
        ),
        decoration: InputDecoration(
          hintText: 'Contraseña',
          hintStyle: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontFamily: 'SF Pro Text',
          ),
          prefixIcon: Icon(
            Icons.lock_outline,
            color: accentColor,
            size: 22,
          ),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: Colors.white.withOpacity(0.7),
              size: 22,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
              HapticFeedback.selectionClick();
            },
          ),
          filled: true,
          fillColor: surfaceColor.withOpacity(0.8),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 20,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: accentColor, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: errorColor, width: 1),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: errorColor, width: 2),
          ),
          errorStyle: const TextStyle(
            color: errorColor,
            fontSize: 12,
            fontFamily: 'SF Pro Text',
          ),
        ),
        obscureText: _obscurePassword,
        validator: _validatePassword,
        autovalidateMode: AutovalidateMode.onUserInteraction,
      ),
    );
  }

  Widget _buildRememberMeCheckbox() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Row(
        children: [
          SizedBox(
            height: 20,
            width: 20,
            child: Checkbox(
              value: _rememberMe,
              onChanged: (value) {
                setState(() {
                  _rememberMe = value ?? false;
                });
                HapticFeedback.selectionClick();
                
                // Si desmarca "recordarme", limpiar credenciales guardadas
                if (!_rememberMe) {
                  _clearSavedCredentials();
                }
              },
              activeColor: accentColor,
              checkColor: Colors.black,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Recordarme',
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 14,
              fontFamily: 'SF Pro Text',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginButton() {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [primaryColor, primaryColor.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _isLoading ? null : _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text(
                    'INICIAR SESIÓN',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                      color: Colors.white,
                      fontFamily: 'SF Pro Display',
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 20,
                    color: Colors.white,
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          height: 1,
          width: 40,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.transparent,
                accentColor.withOpacity(0.5),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          '© Nailsoft 2024 - Todos los derechos reservados',
          style: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontSize: 12,
            fontFamily: 'SF Pro Text',
          ),
        ),
        const SizedBox(width: 12),
        Container(
          height: 1,
          width: 40,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                accentColor.withOpacity(0.5),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildCornerDecorations() {
    return [
      Positioned(
        top: 30,
        left: 30,
        child: _buildCornerDecoration(),
      ),
      Positioned(
        top: 30,
        right: 30,
        child: Transform.rotate(
          angle: 1.57,
          child: _buildCornerDecoration(),
        ),
      ),
      Positioned(
        bottom: 30,
        right: 30,
        child: Transform.rotate(
          angle: 3.14,
          child: _buildCornerDecoration(),
        ),
      ),
      Positioned(
        bottom: 30,
        left: 30,
        child: Transform.rotate(
          angle: 4.71,
          child: _buildCornerDecoration(),
        ),
      ),
    ];
  }

  Widget _buildCornerDecoration() {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            width: 3,
            color: accentColor.withOpacity(0.8),
          ),
          left: BorderSide(
            width: 3,
            color: accentColor.withOpacity(0.8),
          ),
        ),
      ),
    );
  }
}