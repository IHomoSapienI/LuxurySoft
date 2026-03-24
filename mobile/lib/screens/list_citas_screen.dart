import 'package:flutter/material.dart';
import 'package:mobile/models/cita.dart';
import 'package:mobile/models/empleado.dart';
import 'package:mobile/models/venta.dart';
import 'package:mobile/services/api_cita.dart';
import 'package:mobile/services/api_venta.dart';
import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class ListCitasScreen extends StatefulWidget {
  final String token;
  const ListCitasScreen({Key? key, required this.token}) : super(key: key);

  @override
  State<ListCitasScreen> createState() => _ListCitasScreenState();
}

class _ListCitasScreenState extends State<ListCitasScreen> {
  final ApiCita apiCita = ApiCita();
  final ApiVenta apiVenta = ApiVenta();
  bool _isLoading = false;
  String _errorMessage = '';
  List<Cita> _citas = [];
  List<Venta> _ventas = [];
  
  // Calendario
  DateTime _mesActual = DateTime.now();
  
  // Mapa para agrupar citas por día
  Map<DateTime, List<Cita>> _citasPorDia = {};
  
  // Dashboard
  bool _mostrarDashboard = true;
  Map<String, int> _citasPorEmpleado = {};
  double _ventasTotal = 0;
  int _totalCitasHoy = 0;

  @override
  void initState() {
    super.initState();
    
    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    
    // Cargar datos
    _loadCitas();
    _loadVentas();
  }

  Future<void> _loadCitas() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final citas = await apiCita.getCitas(widget.token);
      
      // Agrupar citas por día para el calendario
      Map<DateTime, List<Cita>> citasPorDia = {};
      for (var cita in citas) {
        // Normalizar la fecha (sin hora)
        final fecha = DateTime(cita.fechacita.year, cita.fechacita.month, cita.fechacita.day);
        if (citasPorDia[fecha] == null) {
          citasPorDia[fecha] = [];
        }
        citasPorDia[fecha]!.add(cita);
      }
      
      // Calcular citas por empleado para hoy
      Map<String, int> citasPorEmpleado = {};
      int totalCitasHoy = 0;
      
      final hoy = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
      final citasHoy = citasPorDia[hoy] ?? [];
      
      for (var cita in citasHoy) {
        final nombreEmpleado = cita.nombreempleado.nombreCompleto;
        citasPorEmpleado[nombreEmpleado] = (citasPorEmpleado[nombreEmpleado] ?? 0) + 1;
        totalCitasHoy++;
      }
      
      setState(() {
        _citas = citas;
        _citasPorDia = citasPorDia;
        _citasPorEmpleado = citasPorEmpleado;
        _totalCitasHoy = totalCitasHoy;
        _isLoading = false;
      });
    } catch (e) {
      print('Error al cargar citas: $e');
      setState(() {
        _errorMessage = e.toString();
        _citas = [];
        _citasPorDia = {};
        _citasPorEmpleado = {};
        _totalCitasHoy = 0;
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadVentas() async {
    try {
      final ventas = await apiVenta.getVentas(widget.token);
      
      // Filtrar ventas de hoy
      final hoy = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
      final ventasHoy = ventas.where((venta) {
        final fechaVenta = DateTime(
          venta.fechaCreacion.year,
          venta.fechaCreacion.month,
          venta.fechaCreacion.day
        );
        return fechaVenta.isAtSameMomentAs(hoy);
      }).toList();
      
      // Calcular total de ventas
      double ventasTotal = 0;
      for (var venta in ventasHoy) {
        ventasTotal += venta.total;
      }
      
      setState(() {
        _ventas = ventasHoy;
        _ventasTotal = ventasTotal;
      });
    } catch (e) {
      print('Error al cargar ventas: $e');
    }
  }

  // Método para mostrar el modal con las citas del día
  void _mostrarCitasDelDia(DateTime dia) {
    final citasDelDia = _getCitasDelDia(dia);
    
    if (citasDelDia.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No hay citas para el ${DateFormat('dd/MM/yyyy').format(dia)}'),
          backgroundColor: Colors.grey[800],
        ),
      );
      return;
    }
    
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: const Color(0xFFD4AF37).withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Citas del ${DateFormat('dd/MM/yyyy').format(dia)}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.5,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    children: citasDelDia.map((cita) => _buildCitaItem(cita)).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: const Color(0xFFE0115F),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text('Cerrar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  // Widget para mostrar una cita en el modal
  Widget _buildCitaItem(Cita cita) {
    final clienteNombre = cita.nombrecliente?.nombrecliente ?? "Cliente sin nombre";
    final empleadoNombre = cita.nombreempleado?.nombreempleado ?? "Sin asignar";
    final horaCita = cita.horacita ?? "00:00";
    final Color colorEstado = cita.getColorEstado();
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorEstado.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: colorEstado,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person, size: 16, color: colorEstado),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  clienteNombre,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: colorEstado.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  cita.estadocita,
                  style: TextStyle(
                    color: colorEstado,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: Color(0xFFD4AF37)),
              const SizedBox(width: 8),
              Text(
                'Hora: $horaCita',
                style: const TextStyle(
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.person_pin, size: 16, color: Color(0xFFD4AF37)),
              const SizedBox(width: 8),
              Text(
                'Empleado: $empleadoNombre',
                style: const TextStyle(
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.spa, size: 16, color: Color(0xFFD4AF37)),
              const SizedBox(width: 8),
              Text(
                'Servicios: ${cita.servicios.length}',
                style: const TextStyle(
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Cita> _getCitasDelDia(DateTime dia) {
    final fecha = DateTime(dia.year, dia.month, dia.day);
    return _citasPorDia[fecha] ?? [];
  }
  
  // Método para verificar si un día tiene citas
  bool _tieneCitas(DateTime dia) {
    final fecha = DateTime(dia.year, dia.month, dia.day);
    return _citasPorDia.containsKey(fecha) && _citasPorDia[fecha]!.isNotEmpty;
  }
  
  // Método para obtener el color predominante de las citas de un día
  Color _getColorDia(DateTime dia) {
    final citas = _getCitasDelDia(dia);
    if (citas.isEmpty) return Colors.transparent;
    
    // Prioridad: Pendiente < Confirmada < En Progreso < Completada < Cancelada
    if (citas.any((c) => c.estadocita == 'Cancelada')) {
      return const Color(0xFFEF4444); // Rojo
    } else if (citas.any((c) => c.estadocita == 'Completada')) {
      return const Color(0xFF10B981); // Verde
    } else if (citas.any((c) => c.estadocita == 'En Progreso')) {
      return const Color(0xFFF59E0B); // Amarillo
    } else {
      return const Color(0xFF3B82F6); // Azul (Pendiente/Confirmada)
    }
  }
  
  // Método para cambiar al mes anterior
  void _mesAnterior() {
    setState(() {
      _mesActual = DateTime(_mesActual.year, _mesActual.month - 1, 1);
    });
  }
  
  // Método para cambiar al mes siguiente
  void _mesSiguiente() {
    setState(() {
      _mesActual = DateTime(_mesActual.year, _mesActual.month + 1, 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'CITAS',
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFFD4AF37)),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        actions: [
          IconButton(
            icon: Icon(
              _mostrarDashboard ? Icons.dashboard : Icons.calendar_month,
              color: Color(0xFFD4AF37)
            ),
            onPressed: () {
              setState(() {
                _mostrarDashboard = !_mostrarDashboard;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFD4AF37)),
            onPressed: () {
              _loadCitas();
              _loadVentas();
            },
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
        : _errorMessage.isNotEmpty 
          ? _buildErrorView()
          : Column(
              children: [
                // Dashboard
                if (_mostrarDashboard) _buildDashboard(),
                
                // Calendario
                Expanded(
                  child: _buildCalendario(),
                ),
              ],
            ),
    );
  }
  
  Widget _buildDashboard() {
    final formatCurrency = NumberFormat.currency(locale: 'es_CO', symbol: '\$');
    final fechaHoy = DateFormat('dd/MM/yyyy').format(DateTime.now());
    
    return Container(
      margin: const EdgeInsets.all(16),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Dashboard - $fechaHoy',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFD4AF37),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  setState(() {
                    _mostrarDashboard = false;
                  });
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Resumen de citas y ventas
          Row(
            children: [
              // Total de citas hoy
              Expanded(
                child: _buildDashboardCard(
                  icon: Icons.event,
                  title: 'Citas Hoy',
                  value: _totalCitasHoy.toString(),
                  color: const Color(0xFF3B82F6),
                ),
              ),
              const SizedBox(width: 12),
              
              // Total de ventas hoy
              Expanded(
                child: _buildDashboardCard(
                  icon: Icons.attach_money,
                  title: 'Ventas Hoy',
                  value: formatCurrency.format(_ventasTotal),
                  color: const Color(0xFF10B981),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Título de citas por empleado
          const Text(
            'Citas por Empleado',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          
          // Lista de citas por empleado
          if (_citasPorEmpleado.isEmpty)
            const Text(
              'No hay citas programadas para hoy',
              style: TextStyle(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: Colors.white70,
              ),
            )
          else
            Column(
              children: _citasPorEmpleado.entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.person, size: 14, color: Color(0xFFD4AF37)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          entry.key,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0115F).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          entry.value.toString(),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFE0115F),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
  
  Widget _buildDashboardCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
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
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCalendario() {
    return Column(
      children: [
        // Leyenda de colores
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildLegendItem('Pendiente', const Color(0xFF3B82F6)),
              _buildLegendItem('En Progreso', const Color(0xFFF59E0B)),
              _buildLegendItem('Completada', const Color(0xFF10B981)),
              _buildLegendItem('Cancelada', const Color(0xFFEF4444)),
            ],
          ),
        ),
        
        // Encabezado del mes
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, color: Colors.white),
                onPressed: _mesAnterior,
              ),
              Text(
                DateFormat('MMMM yyyy').format(_mesActual),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right, color: Colors.white),
                onPressed: _mesSiguiente,
              ),
            ],
          ),
        ),
        
        // Calendario
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: _buildCalendarioGrid(),
          ),
        ),
      ],
    );
  }
  
  Widget _buildCalendarioGrid() {
    return Column(
      children: [
        // Días de la semana
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: const [
            Text('L', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('M', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('X', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('J', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('V', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('S', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            Text('D', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        
        // Días del mes
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1.0,
              mainAxisSpacing: 6,
              crossAxisSpacing: 6,
            ),
            itemCount: _obtenerDiasEnMes(_mesActual) + _obtenerPrimerDiaSemana(_mesActual),
            itemBuilder: (context, index) {
              // Calcular el día real
              final int primerDia = _obtenerPrimerDiaSemana(_mesActual);
              if (index < primerDia) {
                return Container(); // Espacios vacíos antes del primer día
              }
              
              final int dia = index - primerDia + 1;
              if (dia > _obtenerDiasEnMes(_mesActual)) {
                return Container(); // Espacios vacíos después del último día
              }
              
              final DateTime fecha = DateTime(_mesActual.year, _mesActual.month, dia);
              final bool esHoy = DateTime.now().year == fecha.year && 
                                DateTime.now().month == fecha.month && 
                                DateTime.now().day == fecha.day;
              final bool tieneCitas = _tieneCitas(fecha);
              final Color colorCitas = _getColorDia(fecha);
              
              return GestureDetector(
                onTap: () => _mostrarCitasDelDia(fecha),
                child: Container(
                  decoration: BoxDecoration(
                    color: tieneCitas ? colorCitas.withOpacity(0.2) : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: esHoy 
                          ? const Color(0xFFD4AF37) 
                          : tieneCitas 
                              ? colorCitas 
                              : Colors.white24,
                      width: esHoy || tieneCitas ? 2 : 1,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      dia.toString(),
                      style: TextStyle(
                        color: esHoy 
                            ? const Color(0xFFD4AF37) 
                            : tieneCitas 
                                ? Colors.white 
                                : Colors.white70,
                        fontSize: 16,
                        fontWeight: esHoy || tieneCitas ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
  
  int _obtenerDiasEnMes(DateTime fecha) {
    return DateTime(fecha.year, fecha.month + 1, 0).day;
  }
  
  int _obtenerPrimerDiaSemana(DateTime fecha) {
    final primerDia = DateTime(fecha.year, fecha.month, 1);
    // Ajustar para que lunes sea 0 y domingo sea 6
    return (primerDia.weekday - 1) % 7;
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
            onPressed: () {
              _loadCitas();
              _loadVentas();
            },
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
