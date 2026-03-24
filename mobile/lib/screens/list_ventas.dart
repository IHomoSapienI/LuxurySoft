import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/models/venta.dart';
import 'package:mobile/services/api_venta.dart';
import 'package:flutter/services.dart';

class ListVentasScreen extends StatefulWidget {
  final String token;

  const ListVentasScreen({super.key, required this.token});

  @override
  State<ListVentasScreen> createState() => _ListVentasScreenState();
}

class _ListVentasScreenState extends State<ListVentasScreen> with SingleTickerProviderStateMixin {
  late Future<List<Venta>> _ventasFuture;
  final ApiVenta _apiVenta = ApiVenta();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  // Variables para paginación
  int _currentPage = 1;
  final int _itemsPerPage = 5; // Menos items por página para ventas debido a su tamaño
  int _totalPages = 1;
  int _totalItems = 0;
  List<Venta> _allVentas = [];
  List<Venta> _paginatedVentas = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadVentas();
    
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
  }

  Future<void> _loadVentas() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final ventas = await _apiVenta.getVentas(widget.token);
      setState(() {
        _allVentas = ventas;
        _totalItems = ventas.length;
        _totalPages = (_totalItems / _itemsPerPage).ceil();
        _updatePaginatedData();
        _isLoading = false;
      });
    } catch (e) {
      print('Error al cargar ventas: $e');
      setState(() {
        _allVentas = [];
        _paginatedVentas = [];
        _totalItems = 0;
        _totalPages = 1;
        _isLoading = false;
      });
    }
  }

  void _updatePaginatedData() {
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    
    _paginatedVentas = _allVentas.sublist(
      startIndex,
      endIndex > _allVentas.length ? _allVentas.length : endIndex,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'VENTAS',
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
                _loadVentas();
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
              if (_isLoading)
                Expanded(child: _buildLoading())
              else if (_allVentas.isEmpty)
                Expanded(child: _buildEmpty())
              else ...[
                // Información de paginación
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Mostrando ${(_currentPage - 1) * _itemsPerPage + 1}-${(_currentPage - 1) * _itemsPerPage + _paginatedVentas.length} de $_totalItems',
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
                
                // Lista de ventas
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    itemCount: _paginatedVentas.length,
                    itemBuilder: (context, index) {
                      final venta = _paginatedVentas[index];
                      return _buildVentaCard(venta);
                    },
                  ),
                ),
                
                // Controles de paginación
                if (_totalPages > 1) _buildPaginationControls(),
              ],
              
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

  /// Widget para mostrar una venta en una tarjeta expandible.
  Widget _buildVentaCard(Venta venta) {
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
        child: Theme(
          data: Theme.of(context).copyWith(
            dividerColor: Colors.transparent,
            colorScheme: ColorScheme.dark(
              primary: const Color(0xFFD4AF37),
              surface: Colors.black.withOpacity(0.7),
            ),
          ),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            leading: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFFD4AF37),
                  width: 1,
                ),
              ),
              child: const CircleAvatar(
                backgroundColor: Color(0xFFE0115F),
                child: Icon(Icons.receipt, color: Colors.white, size: 20),
              ),
            ),
            title: Text(
              'Venta: ${venta.codigoVenta}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Colors.white,
              ),
            ),
            subtitle: Text(
              'Cliente: ${venta.cliente.nombrecliente}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.7),
              ),
            ),
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDetailRow('Fecha de Cita:', DateFormat('yyyy-MM-dd HH:mm').format(venta.cita.fechacita)),
                    _buildDetailRow('Empleado:', venta.empleado.nombreempleado),
                    _buildDetailRow('Método de Pago:', venta.metodoPago),
                    _buildDetailRow('Estado:', venta.estado ? 'Completado' : 'Pendiente'),
                    
                    const Divider(color: Color(0xFFD4AF37), thickness: 0.5, height: 24),
                    
                    const Text(
                      'Productos:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFD4AF37),
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    
                    if (venta.productos.isEmpty)
                      Text(
                        'No hay productos en esta venta',
                        style: TextStyle(
                          fontStyle: FontStyle.italic,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      )
                    else
                      for (var producto in venta.productos)
                        _buildDetailRow(
                          '${producto.nombreProducto}:',
                          '\$${producto.precio} x ${producto.cantidad}',
                        ),

                    const Divider(color: Color(0xFFD4AF37), thickness: 0.5, height: 24),
                    
                    const Text(
                      'Servicios:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFD4AF37),
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    
                    if (venta.servicios.isEmpty)
                      Text(
                        'No hay servicios en esta venta',
                        style: TextStyle(
                          fontStyle: FontStyle.italic,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      )
                    else
                      for (var servicio in venta.servicios)
                        _buildDetailRow(
                          '${servicio.nombreServicio}:',
                          '\$${servicio.precio}',
                        ),

                    const SizedBox(height: 16),
                    
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0115F).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: const Color(0xFFE0115F).withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'TOTAL:',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            '\$${venta.total.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: Color(0xFFE0115F),
                            ),
                          ),
                        ],
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

  /// Widget para mostrar una fila de detalles
  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white.withOpacity(0.7),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  /// Widget para mostrar un mensaje cuando no hay ventas.
  Widget _buildEmpty() {
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
              Icons.shopping_cart,
              size: 60,
              color: Colors.white.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No hay ventas disponibles',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Las ventas aparecerán aquí cuando se registren',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
  
  /// Widget para mostrar el estado de carga
  Widget _buildLoading() {
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
            'Cargando ventas...',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Por favor espere mientras obtenemos los datos',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
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
}
