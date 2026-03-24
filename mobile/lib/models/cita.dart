import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/models/cliente.dart';
import 'package:mobile/models/servicio.dart';
import 'package:mobile/models/empleado.dart';

class Cita {
  final String id;
  final Empleado nombreempleado; // Relación con Empleado
  final Cliente nombrecliente; // Relación con cliente
  final DateTime fechacita;
  final String horacita; // Hora como string en formato HH:mm
  final int duracionTotal; // Duración en minutos
  final String estadocita; // "Pendiente", "Confirmada", "En Progreso", "Completada", "Cancelada"
  final List<Servicio> servicios; // Lista de servicios asociados a la cita
  final String? notas; // Notas adicionales
  final String? motivoCancelacion; // Motivo de cancelación si aplica
  final DateTime? fechaCancelacion; // Fecha de cancelación si aplica
  final bool? horarioLiberado; // Indica si el horario ha sido liberado

  Cita({
    required this.id,
    required this.nombrecliente,
    required this.nombreempleado,
    required this.fechacita,
    required this.horacita,
    required this.duracionTotal,
    required this.estadocita,
    required this.servicios,
    this.notas,
    this.motivoCancelacion,
    this.fechaCancelacion,
    this.horarioLiberado,
  });

  // Creamos una instancia de cita desde un JSON
  factory Cita.fromJson(Map<String, dynamic> json) {
    try {
      print('Procesando JSON de cita: $json');
      
      // Manejar diferentes formatos de ID
      String citaId = '';
      if (json.containsKey('_id')) {
        citaId = json['_id']?.toString() ?? '';
      } else if (json.containsKey('id')) {
        citaId = json['id']?.toString() ?? '';
      }
      
      // Convertir fecha de cita
      DateTime fechaCita;
      try {
        fechaCita = json['fechacita'] != null
            ? DateTime.parse(json['fechacita'].toString())
            : DateTime.now();
      } catch (e) {
        print('Error al parsear fechacita: $e');
        fechaCita = DateTime.now();
      }
      
      // Convertir fecha de cancelación si existe
      DateTime? fechaCancelacion;
      if (json['fechaCancelacion'] != null) {
        try {
          fechaCancelacion = DateTime.parse(json['fechaCancelacion'].toString());
        } catch (e) {
          print('Error al parsear fechaCancelacion: $e');
          fechaCancelacion = null;
        }
      }
      
      // Procesar servicios
      List<Servicio> servicios = [];
      if (json['servicios'] != null && json['servicios'] is List) {
        for (var servicioJson in json['servicios']) {
          try {
            // El servicio puede estar anidado dentro de un objeto con clave 'servicio'
            if (servicioJson is Map && servicioJson.containsKey('servicio')) {
              servicios.add(Servicio.fromJson(servicioJson['servicio']));
            } else {
              servicios.add(Servicio.fromJson(servicioJson));
            }
          } catch (e) {
            print('Error al procesar servicio: $e');
          }
        }
      }
      
      // Calcular duración total basada en los servicios
      int duracion = 0;
      if (servicios.isNotEmpty) {
        duracion = servicios.fold(0, (total, servicio) => total + servicio.tiempo);
      } else if (json['duracionTotal'] != null) {
        // Si no hay servicios pero hay duración total, usarla
        if (json['duracionTotal'] is int) {
          duracion = json['duracionTotal'];
        } else if (json['duracionTotal'] is String) {
          duracion = int.tryParse(json['duracionTotal']) ?? 60;
        } else {
          duracion = 60; // Valor por defecto
        }
      } else {
        duracion = 60; // Valor por defecto
      }
      
      // Crear objetos empleado y cliente con manejo seguro de nulos
      Empleado empleado;
      try {
        empleado = json['nombreempleado'] != null 
            ? Empleado.fromJson(json['nombreempleado']) 
            : Empleado(
                id: '', 
                nombreempleado: 'Sin asignar', 
                apellidoempleado: '', 
                correoempleado: '', 
                telefonoempleado: '', 
                estadoempleado: true
              );
      } catch (e) {
        print('Error al procesar empleado: $e');
        empleado = Empleado(
          id: '', 
          nombreempleado: 'Sin asignar', 
          apellidoempleado: '', 
          correoempleado: '', 
          telefonoempleado: '', 
          estadoempleado: true
        );
      }

      Cliente cliente;
      try {
        cliente = json['nombrecliente'] != null 
            ? Cliente.fromJson(json['nombrecliente']) 
            : Cliente(
                id: '', 
                nombrecliente: 'Sin cliente', 
                correocliente: '', 
                celularcliente: '', 
                estadocliente: true
              );
      } catch (e) {
        print('Error al procesar cliente: $e');
        cliente = Cliente(
          id: '', 
          nombrecliente: 'Sin cliente', 
          correocliente: '', 
          celularcliente: '', 
          estadocliente: true
        );
      }

      return Cita(
        id: citaId,
        nombreempleado: empleado,
        nombrecliente: cliente,
        fechacita: fechaCita,
        horacita: json['horacita']?.toString() ?? '00:00',
        duracionTotal: duracion,
        estadocita: json['estadocita']?.toString() ?? 'Pendiente',
        servicios: servicios,
        notas: json['notas']?.toString(),
        motivoCancelacion: json['motivoCancelacion']?.toString(),
        fechaCancelacion: fechaCancelacion,
        horarioLiberado: json['horarioLiberado'] is bool ? json['horarioLiberado'] : false,
      );
    } catch (e) {
      print('Error al crear Cita desde JSON: $e');
      rethrow;
    }
  }

  // Método para convertir una cita a JSON
  Map<String, dynamic> toJson() {
    try {
      final Map<String, dynamic> data = {
        '_id': id,
        'nombreempleado': nombreempleado.toJson(),
        'nombrecliente': nombrecliente.toJson(),
        'fechacita': DateFormat('yyyy-MM-dd').format(fechacita),
        'horacita': horacita,
        'duracionTotal': duracionTotal,
        'estadocita': estadocita,
        'servicios': servicios.map((servicio) => servicio.toJson()).toList(),
      };
      
      // Agregar campos opcionales si existen
      if (notas != null) data['notas'] = notas;
      if (motivoCancelacion != null) data['motivoCancelacion'] = motivoCancelacion;
      if (fechaCancelacion != null) {
        data['fechaCancelacion'] = DateFormat('yyyy-MM-dd').format(fechaCancelacion!);
      }
      if (horarioLiberado != null) data['horarioLiberado'] = horarioLiberado;
      
      return data;
    } catch (e) {
      print('Error al convertir Cita a JSON: $e');
      return {
        '_id': id,
        'estadocita': estadocita,
      };
    }
  }
  
  // Método para obtener el color según el estado
  Color getColorEstado() {
    switch (estadocita.toLowerCase()) {
      case 'pendiente':
        return const Color(0xFF3B82F6); // Azul
      case 'confirmada':
        return const Color(0xFF3B82F6); // Azul
      case 'en progreso':
        return const Color(0xFFF59E0B); // Amarillo
      case 'completada':
        return const Color(0xFF10B981); // Verde
      case 'cancelada':
        return const Color(0xFFEF4444); // Rojo
      default:
        return const Color(0xFF3B82F6); // Azul por defecto
    }
  }
  
  // Método para obtener la fecha formateada
  String get fechaFormateada {
    return DateFormat('dd/MM/yyyy').format(fechacita);
  }
  
  // Método para obtener la hora de fin
  String get horaFin {
    // Convertir horacita a DateTime
    final List<String> partes = horacita.split(':');
    final int horas = int.parse(partes[0]);
    final int minutos = int.parse(partes[1]);
    
    // Crear un DateTime con la fecha de la cita y la hora
    final DateTime inicio = DateTime(
      fechacita.year,
      fechacita.month,
      fechacita.day,
      horas,
      minutos,
    );
    
    // Sumar la duración
    final DateTime fin = inicio.add(Duration(minutes: duracionTotal));
    
    // Formatear la hora de fin
    return DateFormat('HH:mm').format(fin);
  }
}
