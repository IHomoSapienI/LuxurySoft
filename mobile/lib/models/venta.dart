import 'package:mobile/models/cita.dart';
import 'package:mobile/models/cliente.dart';
import 'package:mobile/models/empleado.dart';
import 'package:mobile/models/producto.dart';
import 'package:mobile/models/servicio.dart';

class Venta {
  final String id;
  final String codigoVenta;
  final Cliente cliente;
  final Cita cita;
  final Empleado empleado;
  final List<Producto> productos;
  final List<Servicio> servicios;
  final double subtotalProductos;
  final double subtotalServicios;
  final double total;
  final String metodoPago;
  final bool estado;
  final String observaciones;
  final DateTime fechaCreacion;
  final DateTime fechaFinalizacion;

  Venta({
    required this.id,
    required this.codigoVenta,
    required this.cliente,
    required this.cita,
    required this.empleado,
    required this.productos,
    required this.servicios,
    required this.subtotalProductos,
    required this.subtotalServicios,
    required this.total,
    required this.metodoPago,
    required this.estado,
    required this.observaciones,
    required this.fechaCreacion,
    required this.fechaFinalizacion,
  });

  // Método para convertir JSON a objeto
  factory Venta.fromJson(Map<String, dynamic> json) {
    return Venta(
      id: json['_id'] ?? '',
      codigoVenta: json['codigoVenta'] ?? '',
      cliente: Cliente.fromJson(json['cliente'] ?? {}),
      cita: Cita.fromJson(json['cita'] ?? {}),
      empleado: Empleado.fromJson(json['empleado'] ?? {}),
      productos: (json['productos'] as List<dynamic>?)
              ?.map((p) => Producto.fromJson(p['producto'] ?? {}))
              .toList() ??
          [],
      servicios: (json['servicios'] as List<dynamic>?)
              ?.map((s) => Servicio.fromJson(s['servicio'] ?? {}))
              .toList() ??
          [],
      subtotalProductos: (json['subtotalProductos'] ?? 0).toDouble(),
      subtotalServicios: (json['subtotalServicios'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      metodoPago: json['metodoPago'] ?? '',
      estado: json["estado"] is bool ? json["estado"] : json["estado"] == "true",
      observaciones: json['observaciones'] ?? '',
      fechaCreacion: json['fechaCreacion'] != null
          ? DateTime.tryParse(json['fechaCreacion']) ?? DateTime(1970, 1, 1)
          : DateTime(1970, 1, 1),
      fechaFinalizacion: json['fechaFinalizacion'] != null
          ? DateTime.tryParse(json['fechaFinalizacion']) ?? DateTime(1970, 1, 1)
          : DateTime(1970, 1, 1),
    );
  }

  // Método para convertir objeto a JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'codigoVenta': codigoVenta,
      'cliente': cliente.toJson(),
      'cita': cita.toJson(),
      'empleado': empleado.toJson(),
      'productos': productos.map((p) => {'producto': p.toJson()}).toList(),
      'servicios': servicios.map((s) => {'servicio': s.toJson()}).toList(),
      'subtotalProductos': subtotalProductos,
      'subtotalServicios': subtotalServicios,
      'total': total,
      'metodoPago': metodoPago,
      'estado': estado,
      'observaciones': observaciones,
      'fechaCreacion': fechaCreacion.toUtc().toIso8601String(),
      'fechaFinalizacion': fechaFinalizacion.toUtc().toIso8601String(),
    };
  }
}
