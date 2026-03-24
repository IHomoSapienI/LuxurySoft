class Producto {
  final String id;
  final String nombreProducto;
  final double precio;
  final int stock;
  final String categoria;
  final bool estado;
  final String imagenUrl;

  //Creamos los contructores para los campos
  Producto ({
    required this.id,
    required this.nombreProducto,
    required this.precio,
    required this.stock,
    required this.categoria,
    required this.estado,
    required this.imagenUrl
  });

//Metodopara crear una instancia de Producto desde un JSON
  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto (
      id: json['_id'] ?? '',
      nombreProducto: json['nombreProducto'] ?? '',
      precio: (json['precio']?? 0.0 ).toDouble(),
      stock: (json['stock'] ?? 0).hashCode,
      categoria: json['categoria'] ?? '',
      estado:json['estado'] ?? true,
      imagenUrl:json['imagenurl'] ?? ''
    );
  }

  get cantidad => null;
  Map<String, dynamic> toJson() {
    return{
      '_id': id,
      'nombreProducto':nombreProducto,
      'precio':precio,
      'stock':stock,
      'categoria':categoria,
      'imagenUrl':imagenUrl
    };
  }


}
