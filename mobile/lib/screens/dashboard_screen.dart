import 'package:flutter/material.dart';
import 'package:mobile/models/cita.dart';
import 'package:mobile/models/empleado.dart';
import 'package:mobile/models/venta.dart';
import 'package:mobile/models/servicio.dart';
import 'package:mobile/services/api_cita.dart';
import 'package:mobile/services/api_venta.dart';
import 'package:mobile/services/api_empleado.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  final String token;
  const DashboardScreen({Key? key, required this.token}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  final ApiCita apiCita = ApiCita();
  final ApiVenta apiVenta = ApiVenta();
  final ApiEmpleado apiEmpleado = ApiEmpleado();
  
  bool _isLoading = true;
  String _errorMessage = '';
  
  // Datos para el dashboard
  List<Cita> _citasHoy = [];
  List<Venta> _ventasHoy = [];
  List<Empleado> _empleados = [];
  
  // Estadísticas calculadas
  Map<String, int> _citasPorEmpleado = {};
  Map<String, double> _ventasPorEmpleado = {};
  Map<String, int> _citasPorEstado = {};
  Map<String, int> _serviciosMasSolicitados = {};
  double _ventasTotal = 0;
  int _totalCitasHoy = 0;
  int _citasPendientes = 0;
  int _citasCompletadas = 0;
  
  // Comparativas
  double _ventasAyer = 0;
  int _citasAyer = 0;
  double _crecimientoVentas = 0;
  double _crecimientoCitas = 0;
  
  // Animación
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    // Configurar animaciones
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeIn,
      ),
    );
    
    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    
    // Cargar datos
    _loadDashboardData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      // Cargar empleados primero para tener la información completa
      final empleados = await apiEmpleado.getEmpleados(widget.token);
      
      // Cargar citas
      final citas = await apiCita.getCitas(widget.token);
      
      // Cargar ventas
      final ventas = await apiVenta.getVentas(widget.token);
      
      // Filtrar datos para hoy
      final hoy = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
      final ayer = DateTime(hoy.year, hoy.month, hoy.day - 1);
      
      // Filtrar citas de hoy
      final citasHoy = citas.where((cita) {
        final fechaCita = DateTime(
          cita.fechacita.year,
          cita.fechacita.month,
          cita.fechacita.day
        );
        return fechaCita.isAtSameMomentAs(hoy);
      }).toList();
      
      // Filtrar citas de ayer para comparativa
      final citasAyer = citas.where((cita) {
        final fechaCita = DateTime(
          cita.fechacita.year,
          cita.fechacita.month,
          cita.fechacita.day
        );
        return fechaCita.isAtSameMomentAs(ayer);
      }).toList();
      
      // Filtrar ventas de hoy
      final ventasHoy = ventas.where((venta) {
        final fechaVenta = DateTime(
          venta.fechaCreacion.year,
          venta.fechaCreacion.month,
          venta.fechaCreacion.day
        );
        return fechaVenta.isAtSameMomentAs(hoy);
      }).toList();
      
      // Filtrar ventas de ayer para comparativa
      final ventasAyer = ventas.where((venta) {
        final fechaVenta = DateTime(
          venta.fechaCreacion.year,
          venta.fechaCreacion.month,
          venta.fechaCreacion.day
        );
        return fechaVenta.isAtSameMomentAs(ayer);
      }).toList();
      
      // Calcular estadísticas
      
      // 1. Citas por empleado
      Map<String, int> citasPorEmpleado = {};
      for (var cita in citasHoy) {
        final nombreEmpleado = cita.nombreempleado.nombreCompleto;
        citasPorEmpleado[nombreEmpleado] = (citasPorEmpleado[nombreEmpleado] ?? 0) + 1;
      }
      
      // 2. Ventas por empleado
      Map<String, double> ventasPorEmpleado = {};
      for (var venta in ventasHoy) {
        final nombreEmpleado = venta.empleado.nombreCompleto;
        ventasPorEmpleado[nombreEmpleado] = (ventasPorEmpleado[nombreEmpleado] ?? 0) + venta.total;
      }
      
      // 3. Citas por estado
      Map<String, int> citasPorEstado = {};
      for (var cita in citasHoy) {
        citasPorEstado[cita.estadocita] = (citasPorEstado[cita.estadocita] ?? 0) + 1;
      }
      
      // 4. Servicios más solicitados
      Map<String, int> serviciosMasSolicitados = {};
      for (var cita in citasHoy) {
        for (var servicio in cita.servicios) {
          serviciosMasSolicitados[servicio.nombreServicio] = 
              (serviciosMasSolicitados[servicio.nombreServicio] ?? 0) + 1;
        }
      }
      
      // Ordenar servicios más solicitados
      var serviciosOrdenados = serviciosMasSolicitados.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      
      // Tomar solo los 5 más solicitados
      Map<String, int> topServicios = {};
      for (var i = 0; i < serviciosOrdenados.length && i < 5; i++) {
        topServicios[serviciosOrdenados[i].key] = serviciosOrdenados[i].value;
      }
      
      // 5. Totales y conteos
      double ventasTotal = 0;
      for (var venta in ventasHoy) {
        ventasTotal += venta.total;
      }
      
      double ventasTotalAyer = 0;
      for (var venta in ventasAyer) {
        ventasTotalAyer += venta.total;
      }
      
      // 6. Calcular crecimiento
      double crecimientoVentas = ventasTotalAyer > 0 
          ? ((ventasTotal - ventasTotalAyer) / ventasTotalAyer) * 100 
          : (ventasTotal > 0 ? 100 : 0);
      
      double crecimientoCitas = citasAyer.length > 0 
          ? ((citasHoy.length - citasAyer.length) / citasAyer.length) * 100 
          : (citasHoy.length > 0 ? 100 : 0);
      
      // 7. Contar citas pendientes y completadas
      int citasPendientes = citasHoy.where((c) => 
          c.estadocita == 'Pendiente' || c.estadocita == 'Confirmada').length;
      
      int citasCompletadas = citasHoy.where((c) => 
          c.estadocita == 'Completada').length;
      
      // Iniciar animación
      _animationController.forward();
      
      // Actualizar estado
      setState(() {
        _empleados = empleados;
        _citasHoy = citasHoy;
        _ventasHoy = ventasHoy;
        _citasPorEmpleado = citasPorEmpleado;
        _ventasPorEmpleado = ventasPorEmpleado;
        _citasPorEstado = citasPorEstado;
        _serviciosMasSolicitados = topServicios;
        _ventasTotal = ventasTotal;
        _totalCitasHoy = citasHoy.length;
        _citasPendientes = citasPendientes;
        _citasCompletadas = citasCompletadas;
        _ventasAyer = ventasTotalAyer;
        _citasAyer = citasAyer.length;
        _crecimientoVentas = crecimientoVentas;
        _crecimientoCitas = crecimientoCitas;
        _isLoading = false;
      });
    } catch (e) {
      print('Error al cargar datos del dashboard: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      drawer: _buildDrawer(context),
      appBar: AppBar(
        title: const Text(
          'DASHBOARD',
          style: TextStyle(
            fontWeight: FontWeight.bold, 
            fontSize: 22,
            letterSpacing: 2,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.black,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Color(0xFFD4AF37)),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFD4AF37)),
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
        : _errorMessage.isNotEmpty 
          ? _buildErrorView()
          : _buildDashboard(),
    );
  }

 Widget _buildDrawer(BuildContext context) {
  return Drawer(
    child: Container(
      color: Colors.black,
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: Colors.black,
              border: Border(
                bottom: BorderSide(
                  color: Color(0xFFD4AF37),
                  width: 1,
                ),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFD4AF37),
                      width: 1,
                    ),
                  ),
                  child: CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Image.asset(
                        'images/logo1.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'MENÚ PRINCIPAL',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
              
                _buildDrawerItem(
                  context,
                  icon: Icons.design_services,
                  title: 'Tipos de Servicio',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/tipoServicios', arguments: widget.token);
                  },
                  isHighlighted: true,
                  useRedColor: true, // Usar color rojo
                ),
                _buildDrawerItem(
                  context,
                  icon: Icons.home_repair_service,
                  title: 'Servicios',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/servicios', arguments: widget.token);
                  },
                  isHighlighted: true,
                ),
                _buildDrawerItem(
                  context,
                  icon: Icons.people,
                  title: 'Usuarios',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/usuarios', arguments: widget.token);
                  },
                  isHighlighted: true,
                  useRedColor: true, // Usar color rojo
                ),
                _buildDrawerItem(
                  context,
                  icon: Icons.shopping_cart,
                  title: 'Ventas',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/ventas', arguments: widget.token);
                  },
                  isHighlighted: true,
                ),
                _buildDrawerItem(
                  context,
                  icon: Icons.person_pin,
                  title: 'Empleados',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/empleados', arguments: widget.token);
                  },
                  isHighlighted: true,
                  useRedColor: true, // Usar color rojo
                ),
                _buildDrawerItem(
                  context,
                  icon: Icons.calendar_today,
                  title: 'Citas',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(context, '/citas', arguments: widget.token);
                  },
                  isHighlighted: true,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: const Color(0xFFD4AF37).withOpacity(0.3),
                  width: 1,
                ),
              ),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFE0115F).withOpacity(0.7),
                        width: 1,
                      ),
                    ),
                    child: const Icon(
                      Icons.logout,
                      color: Color(0xFFE0115F),
                      size: 20,
                    ),
                  ),
                  title: const Text(
                    'Cerrar Sesión',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/');
                  },
                ),
                const SizedBox(height: 8),
                Text(
                  '© Nailsoft 2024 - Todos los derechos reservado',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isHighlighted = false,
    bool isCurrentPage = false,
    bool useRedColor = false, // Nuevo parámetro para usar color rojo
  }) {
    // Definir el color a usar basado en el parámetro useRedColor
    final Color primaryColor = useRedColor ? const Color(0xFFE0115F) : const Color(0xFFD4AF37);
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: isCurrentPage ? primaryColor.withOpacity(0.2) : null,
        border: isCurrentPage 
            ? Border.all(color: primaryColor.withOpacity(0.5), width: 1)
            : null,
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isHighlighted 
                ? primaryColor.withOpacity(0.2)
                : Colors.transparent,
            border: Border.all(
              color: isCurrentPage 
                  ? primaryColor
                  : (isHighlighted 
                      ? primaryColor.withOpacity(0.7)
                      : Colors.white.withOpacity(0.3)),
              width: 1,
            ),
          ),
          child: Icon(
            icon,
            color: isCurrentPage 
                ? primaryColor
                : (isHighlighted 
                    ? primaryColor
                    : Colors.white),
            size: 20,
          ),
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isCurrentPage 
                ? primaryColor
                : Colors.white,
            fontWeight: isCurrentPage ? FontWeight.bold : FontWeight.w500,
          ),
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        hoverColor: primaryColor.withOpacity(0.1),
      ),
    );
  }
  
  Widget _buildDashboard() {
    final formatCurrency = NumberFormat.currency(locale: 'es_CO', symbol: '\$');
    final fechaHoy = DateFormat('dd/MM/yyyy').format(DateTime.now());
    
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
          image: DecorationImage(
            image: AssetImage('images/logo1.png'),
            opacity: 0.05,
            repeat: ImageRepeat.repeat,
            colorFilter: ColorFilter.mode(
              const Color(0xFFD4AF37),
              BlendMode.srcIn,
            ),
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Encabezado del dashboard
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFD4AF37).withOpacity(0.5),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFD4AF37).withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.dashboard, color: Color(0xFFD4AF37)),
                        const SizedBox(width: 8),
                        Text(
                          'Dashboard - $fechaHoy',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFD4AF37),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Resumen de actividad diaria',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Tarjetas de resumen
              Row(
                children: [
                  // Total de citas hoy
                  Expanded(
                    child: _buildSummaryCard(
                      icon: Icons.event,
                      title: 'Citas Hoy',
                      value: _totalCitasHoy.toString(),
                      subtitle: _crecimientoCitas >= 0 
                          ? '+${_crecimientoCitas.toStringAsFixed(1)}% vs ayer'
                          : '${_crecimientoCitas.toStringAsFixed(1)}% vs ayer',
                      color: const Color(0xFF3B82F6),
                      isPositive: _crecimientoCitas >= 0,
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Total de ventas hoy
                  Expanded(
                    child: _buildSummaryCard(
                      icon: Icons.attach_money,
                      title: 'Ventas Hoy',
                      value: formatCurrency.format(_ventasTotal),
                      subtitle: _crecimientoVentas >= 0 
                          ? '+${_crecimientoVentas.toStringAsFixed(1)}% vs ayer'
                          : '${_crecimientoVentas.toStringAsFixed(1)}% vs ayer',
                      color: const Color(0xFF10B981),
                      isPositive: _crecimientoVentas >= 0,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Segunda fila de tarjetas
              Row(
                children: [
                  // Citas pendientes
                  Expanded(
                    child: _buildSummaryCard(
                      icon: Icons.pending_actions,
                      title: 'Pendientes',
                      value: _citasPendientes.toString(),
                      subtitle: 'Por atender hoy',
                      color: const Color(0xFFF59E0B),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Citas completadas
                  Expanded(
                    child: _buildSummaryCard(
                      icon: Icons.check_circle,
                      title: 'Completadas',
                      value: _citasCompletadas.toString(),
                      subtitle: 'Finalizadas hoy',
                      color: const Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Sección de citas por empleado
              _buildSectionHeader('Citas por Empleado', Icons.person),
              
              const SizedBox(height: 16),
              
              _buildCitasPorEmpleadoSection(),
              
              const SizedBox(height: 20),
              
              // Sección de ventas por empleado
              _buildSectionHeader('Ventas por Empleado', Icons.monetization_on),
              
              const SizedBox(height: 16),
              
              _buildVentasPorEmpleadoSection(),
              
              const SizedBox(height: 20),
              
              // Sección de citas por estado
              _buildSectionHeader('Citas por Estado', Icons.pie_chart),
              
              const SizedBox(height: 16),
              
              _buildCitasPorEstadoSection(),
              
              const SizedBox(height: 20),
              
              // Sección de servicios más solicitados
              _buildSectionHeader('Servicios Más Solicitados', Icons.spa),
              
              const SizedBox(height: 16),
              
              _buildServiciosMasSolicitadosSection(),
              
              const SizedBox(height: 20),
              
              // Sección de últimas ventas
              _buildSectionHeader('Últimas Ventas', Icons.receipt_long),
              
              const SizedBox(height: 16),
              
              _buildUltimasVentasSection(),
              
              const SizedBox(height: 20),
              
              // Sección de próximas citas
              _buildSectionHeader('Próximas Citas', Icons.schedule),
              
              const SizedBox(height: 16),
              
              _buildProximasCitasSection(),
              
              const SizedBox(height: 30),
              
              // Pie de página
              Center(
                child: Text(
                  '© Nailsoft 2024 - Todos los derechos reservados ',
                  style: TextStyle(
                    fontSize: 12, 
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFD4AF37).withOpacity(0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildSummaryCard({
    required IconData icon,
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    bool isPositive = true,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (subtitle.contains('%'))
                Icon(
                  isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 12,
                  color: isPositive ? Colors.green : Colors.red,
                ),
              const SizedBox(width: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: subtitle.contains('%')
                      ? (isPositive ? Colors.green : Colors.red)
                      : Colors.white70,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: const Color(0xFFD4AF37)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
  
  Widget _buildCitasPorEmpleadoSection() {
    if (_citasPorEmpleado.isEmpty) {
      return _buildEmptyState('No hay citas programadas para hoy');
    }
    
    // Ordenar empleados por número de citas (descendente)
    var empleadosOrdenados = _citasPorEmpleado.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          for (var entry in empleadosOrdenados)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF3B82F6).withOpacity(0.5),
                        width: 1,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        entry.key.isNotEmpty ? entry.key[0].toUpperCase() : '?',
                        style: const TextStyle(
                          color: Color(0xFF3B82F6),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.key,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        // Barra de progreso
                        LinearProgressIndicator(
                          value: entry.value / (_totalCitasHoy > 0 ? _totalCitasHoy : 1),
                          backgroundColor: Colors.white.withOpacity(0.1),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      entry.value.toString(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF3B82F6),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildVentasPorEmpleadoSection() {
    final formatCurrency = NumberFormat.currency(locale: 'es_CO', symbol: '\$');
    
    if (_ventasPorEmpleado.isEmpty) {
      return _buildEmptyState('No hay ventas registradas hoy');
    }
    
    // Ordenar empleados por monto de ventas (descendente)
    var empleadosOrdenados = _ventasPorEmpleado.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    // Encontrar el valor máximo para calcular el porcentaje de la barra
    double maxVenta = empleadosOrdenados.first.value;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          for (var entry in empleadosOrdenados)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF10B981).withOpacity(0.5),
                        width: 1,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        entry.key.isNotEmpty ? entry.key[0].toUpperCase() : '?',
                        style: const TextStyle(
                          color: Color(0xFF10B981),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.key,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        // Barra de progreso
                        LinearProgressIndicator(
                          value: entry.value / (maxVenta > 0 ? maxVenta : 1),
                          backgroundColor: Colors.white.withOpacity(0.1),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    formatCurrency.format(entry.value),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildCitasPorEstadoSection() {
    if (_citasPorEstado.isEmpty) {
      return _buildEmptyState('No hay citas programadas para hoy');
    }
    
    // Mapa de colores por estado
    final Map<String, Color> colorPorEstado = {
      'Pendiente': const Color(0xFF3B82F6),
      'Confirmada': const Color(0xFF3B82F6),
      'En Progreso': const Color(0xFFF59E0B),
      'Completada': const Color(0xFF10B981),
      'Cancelada': const Color(0xFFEF4444),
    };
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Gráfico de barras horizontal
          for (var entry in _citasPorEstado.entries)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: colorPorEstado[entry.key] ?? Colors.grey,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        entry.key,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${entry.value} (${(_totalCitasHoy > 0 ? (entry.value / _totalCitasHoy * 100).toStringAsFixed(1) : '0')}%)',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Barra de progreso
                  LinearProgressIndicator(
                    value: _totalCitasHoy > 0 ? entry.value / _totalCitasHoy : 0,
                    backgroundColor: Colors.white.withOpacity(0.1),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      colorPorEstado[entry.key] ?? Colors.grey,
                    ),
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildServiciosMasSolicitadosSection() {
    if (_serviciosMasSolicitados.isEmpty) {
      return _buildEmptyState('No hay servicios solicitados hoy');
    }
    
    // Encontrar el valor máximo para calcular el porcentaje de la barra
    int maxServicios = _serviciosMasSolicitados.values.reduce((a, b) => a > b ? a : b);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          for (var entry in _serviciosMasSolicitados.entries)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.spa, size: 16, color: Color(0xFFD4AF37)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          entry.key,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD4AF37).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          entry.value.toString(),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFD4AF37),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Barra de progreso
                  LinearProgressIndicator(
                    value: maxServicios > 0 ? entry.value / maxServicios : 0,
                    backgroundColor: Colors.white.withOpacity(0.1),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37)),
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildUltimasVentasSection() {
    final formatCurrency = NumberFormat.currency(locale: 'es_CO', symbol: '\$');
    final formatTime = DateFormat('HH:mm');
    
    if (_ventasHoy.isEmpty) {
      return _buildEmptyState('No hay ventas registradas hoy');
    }
    
    // Ordenar ventas por fecha (más recientes primero)
    var ventasOrdenadas = List<Venta>.from(_ventasHoy)
      ..sort((a, b) => b.fechaCreacion.compareTo(a.fechaCreacion));
    
    // Tomar solo las 5 más recientes
    var ultimasVentas = ventasOrdenadas.take(5).toList();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          for (var venta in ultimasVentas)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0115F).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFE0115F).withOpacity(0.5),
                        width: 1,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.receipt,
                        color: Color(0xFFE0115F),
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Venta: ${venta.codigoVenta}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Cliente: ${venta.cliente.nombrecliente}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withOpacity(0.7),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        formatCurrency.format(venta.total),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFE0115F),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatTime.format(venta.fechaCreacion),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildProximasCitasSection() {
    final formatTime = DateFormat('HH:mm');
    
    if (_citasHoy.isEmpty) {
      return _buildEmptyState('No hay citas programadas para hoy');
    }
    
    // Filtrar citas pendientes o confirmadas
    var citasPendientes = _citasHoy.where((cita) => 
        cita.estadocita == 'Pendiente' || cita.estadocita == 'Confirmada').toList();
    
    if (citasPendientes.isEmpty) {
      return _buildEmptyState('No hay citas pendientes para hoy');
    }
    
    // Ordenar citas por hora
    citasPendientes.sort((a, b) {
      final horaA = a.horacita.split(':');
      final horaB = b.horacita.split(':');
      final timeA = TimeOfDay(hour: int.parse(horaA[0]), minute: int.parse(horaA[1]));
      final timeB = TimeOfDay(hour: int.parse(horaB[0]), minute: int.parse(horaB[1]));
      return (timeA.hour * 60 + timeA.minute) - (timeB.hour * 60 + timeB.minute);
    });
    
    // Tomar solo las 5 próximas
    var proximasCitas = citasPendientes.take(5).toList();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          for (var cita in proximasCitas)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFF3B82F6).withOpacity(0.5),
                        width: 1,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        cita.horacita,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF3B82F6),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          cita.nombrecliente.nombrecliente,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Empleado: ${cita.nombreempleado.nombreCompleto}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withOpacity(0.7),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: cita.getColorEstado().withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      cita.estadocita,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: cita.getColorEstado(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildEmptyState(String message) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.info_outline,
              size: 32,
              color: Colors.white.withOpacity(0.5),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 48,
            color: Color(0xFFE0115F),
          ),
          const SizedBox(height: 16),
          const Text(
            'Ha ocurrido un error',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              _errorMessage,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadDashboardData,
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
            style: ElevatedButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: const Color(0xFFE0115F),
            ),
          ),
        ],
      ),
    );
  }
}
