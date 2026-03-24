import 'package:flutter/material.dart';
import 'package:mobile/models/empleado.dart';
import 'package:mobile/services/api_empleado.dart';
import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:flutter/services.dart';

class ListEmpleadosScreen extends StatefulWidget {
  final String token;
  const ListEmpleadosScreen({Key? key, required this.token}) : super(key: key);

  @override
  State<ListEmpleadosScreen> createState() => _ListEmpleadosScreenState();
}

class _ListEmpleadosScreenState extends State<ListEmpleadosScreen> with SingleTickerProviderStateMixin {
  final ApiEmpleado apiEmpleado = ApiEmpleado();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _isLoading = false;
  String _errorMessage = '';
  List<Empleado> _empleados = [];

  // Variables para paginación
  int _currentPage = 1;
  final int _itemsPerPage = 10;
  int _totalPages = 1;
  int _totalItems = 0;
  List<Empleado> _allEmpleados = [];
  List<Empleado> _paginatedEmpleados = [];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeIn,
      ),
    );
    _animationController.forward();
    
    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    
    // Inicializar el Future después de configurar las animaciones
    _loadEmpleados();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadEmpleados() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      print('Iniciando carga de empleados con token: ${widget.token}');
      final empleados = await apiEmpleado.getEmpleados(widget.token);
      print('Empleados cargados: ${empleados.length}');
      
      setState(() {
        _allEmpleados = empleados;
        _totalItems = empleados.length;
        _totalPages = (_totalItems / _itemsPerPage).ceil();
        _updatePaginatedData();
        _isLoading = false;
      });
    } catch (e) {
      print('Error al cargar empleados: $e');
      setState(() {
        _errorMessage = e.toString();
        _allEmpleados = [];
        _paginatedEmpleados = [];
        _totalItems = 0;
        _totalPages = 1;
        _isLoading = false;
      });
    }
  }

  void _updatePaginatedData() {
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    
    _paginatedEmpleados = _allEmpleados.sublist(
      startIndex,
      endIndex > _allEmpleados.length ? _allEmpleados.length : endIndex,
    );
  }

  void _goToPage(int page) {
    if (page >= 1 && page <= _totalPages) {
      setState(() {
        _currentPage = page;
        _updatePaginatedData();
      });
    }
  }

  void _nextPage() {
    if (_currentPage < _totalPages) {
      _goToPage(_currentPage + 1);
    }
  }

  void _previousPage() {
    if (_currentPage > 1) {
      _goToPage(_currentPage - 1);
    }
  }

  Future<void> _deleteEmpleado(String id) async {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.warning,
      animType: AnimType.scale,
      title: '¿Estás seguro?',
      desc: 'Esta acción eliminará permanentemente el empleado.',
      btnCancelOnPress: () {},
      btnOkOnPress: () async {
        try {
          await apiEmpleado.deleteEmpleado(widget.token, id);
          _showSuccessDialog('Empleado eliminado con éxito');
          _loadEmpleados();
        } catch (e) {
          _showErrorDialog('Error al eliminar: $e');
        }
      },
      btnOkColor: const Color(0xFFE0115F),
    ).show();
  }

  void _showSuccessDialog(String message) {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.success,
      animType: AnimType.bottomSlide,
      title: 'Éxito',
      desc: message,
      btnOkOnPress: () {},
      btnOkColor: const Color(0xFFE0115F),
    ).show();
  }

  void _showErrorDialog(String message) {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.error,
      animType: AnimType.bottomSlide,
      title: 'Error',
      desc: message,
      btnOkOnPress: () {},
      btnOkColor: const Color(0xFFE0115F),
    ).show();
  }

  Future<void> _showEmpleadoDialog({Empleado? empleado}) async {
    final isEditing = empleado != null;
    final nombreController = TextEditingController(text: empleado?.nombreempleado ?? '');
    final apellidoController = TextEditingController(text: empleado?.apellidoempleado ?? '');
    final correoController = TextEditingController(text: empleado?.correoempleado ?? '');
    final telefonoController = TextEditingController(text: empleado?.telefonoempleado ?? '');
    bool estadoValue = empleado?.estadoempleado ?? true;

    final result = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: Colors.black.withOpacity(0.9),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
                side: BorderSide(
                  color: const Color(0xFFD4AF37).withOpacity(0.5),
                  width: 1,
                ),
              ),
              title: Text(
                isEditing ? 'Editar Empleado' : 'Agregar Empleado',
                style: const TextStyle(
                  fontWeight: FontWeight.bold, 
                  color: Color(0xFFD4AF37),
                  fontSize: 20,
                ),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildTextField(nombreController, 'Nombre', Icons.person),
                    const SizedBox(height: 16),
                    _buildTextField(apellidoController, 'Apellido', Icons.person_outline),
                    const SizedBox(height: 16),
                    _buildTextField(correoController, 'Correo Electrónico', Icons.email, keyboardType: TextInputType.emailAddress),
                    const SizedBox(height: 16),
                    _buildTextField(telefonoController, 'Teléfono', Icons.phone, keyboardType: TextInputType.phone),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text(
                        'Estado',
                        style: TextStyle(color: Colors.white),
                      ),
                      subtitle: Text(
                        estadoValue ? 'Activo' : 'Inactivo',
                        style: TextStyle(
                          color: estadoValue ? Colors.green : Colors.red,
                        ),
                      ),
                      value: estadoValue,
                      onChanged: (value) {
                        setState(() {
                          estadoValue = value;
                        });
                      },
                      activeColor: const Color(0xFFE0115F),
                      activeTrackColor: const Color(0xFFE0115F).withOpacity(0.5),
                      inactiveThumbColor: Colors.grey,
                      inactiveTrackColor: Colors.grey.withOpacity(0.5),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  child: const Text('Cancelar', style: TextStyle(color: Colors.white70)),
                  onPressed: () => Navigator.of(context).pop(false),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE0115F),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: Text(isEditing ? 'Actualizar' : 'Agregar'),
                  onPressed: () async {
                    if (nombreController.text.isEmpty || apellidoController.text.isEmpty || 
                        correoController.text.isEmpty || telefonoController.text.isEmpty) {
                      _showErrorDialog('Todos los campos son obligatorios');
                      return;
                    }
                    
                    final newEmpleado = Empleado(
                      id: empleado?.id ?? '',
                      nombreempleado: nombreController.text,
                      apellidoempleado: apellidoController.text,
                      correoempleado: correoController.text,
                      telefonoempleado: telefonoController.text,
                      estadoempleado: estadoValue,
                    );
                    
                    try {
                      if (isEditing) {
                        await apiEmpleado.updateEmpleado(widget.token, newEmpleado);
                      } else {
                        await apiEmpleado.addEmpleado(widget.token, newEmpleado);
                      }
                      Navigator.of(context).pop(true);
                    } catch (e) {
                      _showErrorDialog('Error: $e');
                      Navigator.of(context).pop(false);
                    }
                  },
                ),
              ],
            );
          }
        );
      },
    );

    if (result == true) {
      _showSuccessDialog(isEditing ? 'Empleado actualizado con éxito' : 'Empleado agregado con éxito');
      _loadEmpleados();
    }
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
        prefixIcon: Icon(icon, color: const Color(0xFFD4AF37)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 2),
        ),
        filled: true,
        fillColor: Colors.white.withOpacity(0.1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'EMPLEADOS',
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
            icon: const Icon(Icons.refresh, color: Color(0xFFD4AF37)),
            onPressed: _loadEmpleados,
          ),
        ],
      ),
      body: Container(
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
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            children: [
              Expanded(
                child: _isLoading 
                ? _buildLoadingIndicator()
                : _errorMessage.isNotEmpty 
                  ? _buildErrorView()
                  : _buildEmpleadosList(),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                child: const Text(
                  '© Nailsoft 2024 - Todos los derechos reservados',
                  style: TextStyle(
                    fontSize: 12, 
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFD4AF37),
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildEmpleadosList() {
  if (_allEmpleados.isEmpty) {
    return _buildEmptyView();
  }
  
  return Column(
    children: [
      // Información de paginación
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                'Mostrando ${(_currentPage - 1) * _itemsPerPage + 1}-${(_currentPage - 1) * _itemsPerPage + _paginatedEmpleados.length} de $_totalItems',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 12,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              'Página $_currentPage de $_totalPages',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
      
      // Lista paginada
      Expanded(
        child: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          itemCount: _paginatedEmpleados.length,
          itemBuilder: (context, index) {
            final empleado = _paginatedEmpleados[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD4AF37).withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Card(
                elevation: 0,
                color: Colors.black.withOpacity(0.7),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: const Color(0xFFD4AF37).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: const Color(0xFFD4AF37).withOpacity(0.5),
                            width: 1,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            empleado.nombreempleado.isNotEmpty ? empleado.nombreempleado[0].toUpperCase() : '?',
                            style: const TextStyle(
                              color: Color(0xFFD4AF37),
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
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
                              '${empleado.nombreempleado} ${empleado.apellidoempleado}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Colors.white,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.email, size: 12, color: Color(0xFFD4AF37)),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    empleado.correoempleado,
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.7),
                                      fontSize: 12,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.phone, size: 12, color: Color(0xFFD4AF37)),
                                const SizedBox(width: 4),
                                Text(
                                  empleado.telefonoempleado,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.7),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(
                                  empleado.estadoempleado ? Icons.check_circle : Icons.cancel,
                                  size: 12,
                                  color: empleado.estadoempleado ? Colors.green : Colors.red,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  empleado.estadoempleado ? 'Activo' : 'Inactivo',
                                  style: TextStyle(
                                    color: empleado.estadoempleado ? Colors.green : Colors.red,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
      
      // Controles de paginación
      if (_totalPages > 1) _buildPaginationControls(),
    ],
  );
}

Widget _buildPaginationControls() {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: _currentPage > 1 ? _previousPage : null,
          icon: Icon(Icons.arrow_back_ios, color: _currentPage > 1 ? const Color(0xFFD4AF37) : Colors.grey),
        ),
        Text(
          '$_currentPage/$_totalPages',
          style: const TextStyle(color: Colors.white),
        ),
        IconButton(
          onPressed: _currentPage < _totalPages ? _nextPage : null,
          icon: Icon(Icons.arrow_forward_ios, color: _currentPage < _totalPages ? const Color(0xFFD4AF37) : Colors.grey),
        ),
      ],
    ),
  );
}
  
  Widget _buildLoadingIndicator() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFFD4AF37).withOpacity(0.5),
                width: 2,
              ),
            ),
            child: const CircularProgressIndicator(
              color: Color(0xFFD4AF37),
              strokeWidth: 3,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Cargando empleados...',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildErrorView({String? error}) {
    final errorMsg = error ?? _errorMessage;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFFE0115F).withOpacity(0.5),
                width: 2,
              ),
            ),
            child: const Icon(
              Icons.error_outline,
              size: 60,
              color: Color(0xFFE0115F),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Ha ocurrido un error',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Error: $errorMsg',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadEmpleados,
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
            style: ElevatedButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: const Color(0xFFE0115F),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFFD4AF37).withOpacity(0.5),
                width: 2,
              ),
            ),
            child: Icon(
              Icons.people,
              size: 60,
              color: Colors.white.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No hay empleados disponibles',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadEmpleados,
            icon: const Icon(Icons.refresh),
            label: const Text('Actualizar'),
            style: ElevatedButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: const Color(0xFFE0115F),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
