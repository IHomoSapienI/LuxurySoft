import 'package:flutter/material.dart';
import 'package:mobile/models/servicio.dart';
import 'package:mobile/models/tipo_servicio.dart';
import 'package:mobile/services/api_servicio.dart';
import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:flutter/services.dart';

class ListServicesScreen extends StatefulWidget {
  final String token;
  const ListServicesScreen({required this.token, super.key});

  @override
  State<ListServicesScreen> createState() => _ListServicesScreenState();
}

class _ListServicesScreenState extends State<ListServicesScreen> with SingleTickerProviderStateMixin {
  final ApiServicio apiServicio = ApiServicio();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  // Variables para paginación
  int _currentPage = 1;
  final int _itemsPerPage = 8;
  int _totalPages = 1;
  int _totalItems = 0;
  List<Servicio> _allServicios = [];
  List<Servicio> _paginatedServicios = [];

  @override
  void initState() {
    super.initState();
    _loadServicios();
    
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
    
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
  }

  Future<void> _loadServicios() async {
    try {
      final servicios = await apiServicio.getServicios(widget.token);
      setState(() {
        _allServicios = servicios;
        _totalItems = servicios.length;
        _totalPages = (_totalItems / _itemsPerPage).ceil();
        _updatePaginatedData();
      });
    } catch (e) {
      print('Error al cargar servicios: $e');
      setState(() {
        _allServicios = [];
        _paginatedServicios = [];
        _totalItems = 0;
        _totalPages = 1;
      });
    }
  }

  void _updatePaginatedData() {
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    
    _paginatedServicios = _allServicios.sublist(
      startIndex,
      endIndex > _allServicios.length ? _allServicios.length : endIndex,
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

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _refreshServicios() async {
    await _loadServicios();
  }

  void _showServiceDialog({Servicio? servicio}) {
    final TextEditingController nombreController =
        TextEditingController(text: servicio?.nombreServicio ?? '');
    final TextEditingController descripcionController =
        TextEditingController(text: servicio?.descripcion ?? '');
    final TextEditingController precioController =
        TextEditingController(text: servicio?.precio.toString() ?? '');
    final TextEditingController tiempoController =
        TextEditingController(text: servicio?.tiempo.toString() ?? '');
    final TextEditingController imagenController =
        TextEditingController(text: servicio?.imagenUrl ?? '');

    showDialog(
      context: context,
      builder: (_) {
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
            servicio == null ? 'Agregar Servicio' : 'Editar Servicio',
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
                _buildTextField(nombreController, 'Nombre del Servicio', Icons.work),
                const SizedBox(height: 16),
                _buildTextField(descripcionController, 'Descripción', Icons.description),
                const SizedBox(height: 16),
                _buildTextField(precioController, 'Precio', Icons.attach_money, keyboardType: TextInputType.number),
                const SizedBox(height: 16),
                _buildTextField(tiempoController, 'Tiempo (min)', Icons.timer, keyboardType: TextInputType.number),
                const SizedBox(height: 16),
                _buildTextField(imagenController, 'URL de la Imagen', Icons.image),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Cancelar', 
                style: TextStyle(color: Colors.white70)
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                final newServicio = Servicio(
                  id: servicio?.id ?? '',
                  nombreServicio: nombreController.text,
                  descripcion: descripcionController.text,
                  precio: double.tryParse(precioController.text) ?? 0.0,
                  tiempo: int.tryParse(tiempoController.text) ?? 0,
                  nombreTs: servicio?.nombreTs ??
                      TipoServicio(id: '1', nombreTs: 'General', estado: true),
                  estado: true,
                  imagenUrl: imagenController.text,
                );

                try {
                  if (servicio == null) {
                    await apiServicio.addServicio(widget.token, newServicio);
                  } else {
                    await apiServicio.updateServicio(widget.token, newServicio);
                  }
                  _refreshServicios();
                  Navigator.of(context).pop();
                  AwesomeDialog(
                    context: context,
                    dialogType: DialogType.success,
                    animType: AnimType.bottomSlide,
                    title: 'Éxito',
                    desc: servicio == null ? 'Servicio agregado con éxito' : 'Servicio actualizado con éxito',
                    btnOkOnPress: () {},
                    btnOkColor: const Color(0xFFE0115F),
                  ).show();
                } catch (e) {
                  _showErrorDialog('Error: $e');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE0115F),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: Text(servicio == null ? 'Agregar' : 'Actualizar'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
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
      keyboardType: keyboardType,
    );
  }

  Future<void> _deleteServicio(String id) async {
    AwesomeDialog(
      context: context,
      dialogType: DialogType.warning,
      animType: AnimType.scale,
      title: '¿Estás seguro?',
      desc: 'Esta acción eliminará permanentemente el servicio.',
      btnCancelOnPress: () {},
      btnOkOnPress: () async {
        try {
          await apiServicio.deleteServicio(widget.token, id);
          AwesomeDialog(
            context: context,
            dialogType: DialogType.success,
            animType: AnimType.bottomSlide,
            title: 'Éxito',
            desc: 'Servicio eliminado con éxito',
            btnOkOnPress: () {},
            btnOkColor: const Color(0xFFE0115F),
          ).show();
          _refreshServicios();
        } catch (e) {
          _showErrorDialog('Error al eliminar: $e');
        }
      },
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

  Widget _buildServiceCard(Servicio servicio) {
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
              _buildLeadingImageOrIcon(servicio.imagenUrl),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      servicio.nombreServicio,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.white,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      servicio.descripcion,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Precio: \$${servicio.precio.toStringAsFixed(2)} - Duración: ${servicio.tiempo} min',
                      style: const TextStyle(
                        color: Color(0xFFD4AF37),
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
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
              Icons.design_services,
              size: 60,
              color: Colors.white.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No hay servicios disponibles',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'SERVICIOS',
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
            onPressed: () {
              setState(() {
                _refreshServicios();
              });
            },
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
              if (_allServicios.isNotEmpty) ...[
                // Información de paginación
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Mostrando ${(_currentPage - 1) * _itemsPerPage + 1}-${(_currentPage - 1) * _itemsPerPage + _paginatedServicios.length} de $_totalItems',
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
                
                // Lista de servicios
                Expanded(
                  child: _paginatedServicios.isEmpty
                      ? _buildEmptyView()
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          itemCount: _paginatedServicios.length,
                          itemBuilder: (context, index) {
                            final servicio = _paginatedServicios[index];
                            return _buildServiceCard(servicio);
                          },
                        ),
                ),
                
                // Controles de paginación
                if (_totalPages > 1) _buildPaginationControls(),
              ] else
                Expanded(child: _buildEmptyView()),
            
              // Footer
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

  Widget _buildLeadingImageOrIcon(String? imageUrl) {
    if (imageUrl != null && imageUrl.isNotEmpty) {
      try {
        Uri.parse(imageUrl);
        return Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: const Color(0xFFD4AF37).withOpacity(0.5),
              width: 1,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(7),
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: Colors.black,
                child: const Icon(
                  Icons.broken_image,
                  size: 30,
                  color: Color(0xFFD4AF37),
                ),
              ),
            ),
          ),
        );
      } catch (e) {
        return Container(
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
          child: const Icon(
            Icons.design_services,
            size: 30,
            color: Color(0xFFD4AF37),
          ),
        );
      }
    }
    return Container(
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
      child: const Icon(
        Icons.design_services,
        size: 30,
        color: Color(0xFFD4AF37),
      ),
    );
  }
}
