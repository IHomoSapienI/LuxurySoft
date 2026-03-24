import 'package:mobile/models/tipo_servicio.dart';

class Servicio {
  final String id; // Definimos el tipo como String
  final String nombreServicio;
  final String descripcion;
  final double precio;
  final int tiempo;
  final TipoServicio nombreTs; // Relación con el modelo TipoServicio
  final bool estado;
  final String imagenUrl;

  Servicio({
    required this.id,
    required this.nombreServicio,
    required this.descripcion,
    required this.precio,
    required this.tiempo,
    required this.nombreTs,
    required this.estado,
    required this.imagenUrl,
  });

  // Método para crear una instancia de Servicio desde un JSON
  factory Servicio.fromJson(Map<String, dynamic> json) {
    return Servicio(
      id: json['_id'] ?? '', // Mapea el campo '_id'
      nombreServicio: json['nombreServicio'] ?? '', // Mapea 'nombreServicio'
      descripcion: json['descripcion'] ?? '', // Mapea 'descripcion'
      precio: (json['precio'] ?? 0.0).toDouble(), // Asegura que sea un double
      tiempo: json['tiempo'] ?? 0, // Mapea 'tiempo'
      nombreTs: TipoServicio.fromJson(json['nombreTs'] ?? {}), // Convierte 'nombreTs' a un objeto TipoServicio
      estado: json['estado'] ?? true, // Mapea 'estado' o usa true por defecto
      imagenUrl: json['imagenUrl'] ?? '', // Mapea 'imagenUrl'
    );
  }

  // Método para convertir un Servicio a JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'nombreServicio': nombreServicio,
      'descripcion': descripcion,
      'precio': precio,
      'tiempo': tiempo,
      'nombreTs': nombreTs.toJson(), // Convierte TipoServicio a JSON
      'estado': estado,
      'imagenUrl': imagenUrl,
    };
  }
}
