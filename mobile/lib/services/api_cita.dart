import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/models/cita.dart';
import 'package:intl/intl.dart';

class ApiCita {
  static const String baseUrl = "https://gitbf.onrender.com/api/citas";

  // Método para obtener todas las citas
  Future<List<Cita>> getCitas(String token, {
    String? filtroEstado,
    String? filtroEmpleado,
    String? busqueda,
    DateTime? fecha,
  }) async {
    try {
      // Construir la URL con los parámetros de filtro
      String url = baseUrl;
      List<String> parametros = [];
      
      if (filtroEstado != null && filtroEstado.isNotEmpty) {
        parametros.add('estado=$filtroEstado');
      }
      
      if (filtroEmpleado != null && filtroEmpleado.isNotEmpty) {
        parametros.add('empleadoId=$filtroEmpleado');
      }
      
      if (fecha != null) {
        final fechaFormateada = DateFormat('yyyy-MM-dd').format(fecha);
        parametros.add('fechacita=$fechaFormateada');
      }
      
      if (parametros.isNotEmpty) {
        url += '?' + parametros.join('&');
      }
      
      print('URL de solicitud: $url');
      print('Obteniendo citas con token: $token');
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('Código de respuesta: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        // Imprimir la respuesta completa para depuración
        print('Respuesta completa: ${response.body}');
        
        final dynamic jsonData = jsonDecode(response.body);
        
        // Verificar si la respuesta es un objeto o una lista
        if (jsonData is Map<String, dynamic>) {
          // Si es un objeto, buscar la clave 'citas'
          if (jsonData.containsKey('citas')) {
            final List<dynamic> citasData = jsonData['citas'];
            print('Citas encontradas: ${citasData.length}');
            
            // Crear una lista para almacenar las citas procesadas
            List<Cita> citas = [];
            
            // Procesar cada cita individualmente para capturar errores específicos
            for (var i = 0; i < citasData.length; i++) {
              try {
                var citaData = citasData[i];
                print('Procesando cita $i: $citaData');
                
                // Aplicar filtro de búsqueda si existe
                if (busqueda != null && busqueda.isNotEmpty) {
                  final busquedaLower = busqueda.toLowerCase();
                  final nombreCliente = citaData['nombrecliente']?['nombrecliente']?.toString().toLowerCase() ?? '';
                  final apellidoCliente = citaData['nombrecliente']?['apellidocliente']?.toString().toLowerCase() ?? '';
                  final nombreEmpleado = citaData['nombreempleado']?['nombreempleado']?.toString().toLowerCase() ?? '';
                  
                  if (!nombreCliente.contains(busquedaLower) && 
                      !apellidoCliente.contains(busquedaLower) && 
                      !nombreEmpleado.contains(busquedaLower)) {
                    continue; // Saltar esta cita si no coincide con la búsqueda
                  }
                }
                
                citas.add(Cita.fromJson(citaData));
              } catch (e) {
                print('Error al procesar cita $i: $e');
                // Continuar con la siguiente cita en lugar de fallar completamente
              }
            }
            
            return citas;
          } else {
            // Buscar cualquier lista en la respuesta que pueda contener citas
            for (var key in jsonData.keys) {
              if (jsonData[key] is List) {
                print('Encontrada lista en clave: $key');
                final List<dynamic> possibleCitas = jsonData[key];
                if (possibleCitas.isNotEmpty && possibleCitas[0] is Map<String, dynamic>) {
                  print('Intentando mapear lista de $key como citas');
                  
                  // Crear una lista para almacenar las citas procesadas
                  List<Cita> citas = [];
                  
                  // Procesar cada cita individualmente
                  for (var i = 0; i < possibleCitas.length; i++) {
                    try {
                      citas.add(Cita.fromJson(possibleCitas[i]));
                    } catch (e) {
                      print('Error al procesar posible cita $i: $e');
                      // Continuar con la siguiente
                    }
                  }
                  
                  return citas;
                }
              }
            }
            
            // Si no hay una lista clara, intentar usar todo el objeto como una sola cita
            if (jsonData.containsKey('_id') || jsonData.containsKey('id') || 
                jsonData.containsKey('fechacita')) {
              print('Intentando mapear objeto como una sola cita');
              try {
                return [Cita.fromJson(jsonData)];
              } catch (e) {
                print('Error al procesar objeto como cita: $e');
                return [];
              }
            }
            
            print('No se encontró una estructura de citas reconocible');
            return [];
          }
        } else if (jsonData is List) {
          // Si la respuesta es directamente una lista, asumimos que son citas
          print('La respuesta es una lista directa. Elementos: ${jsonData.length}');
          
          // Crear una lista para almacenar las citas procesadas
          List<Cita> citas = [];
          
          // Procesar cada cita individualmente
          for (var i = 0; i < jsonData.length; i++) {
            try {
              citas.add(Cita.fromJson(jsonData[i]));
            } catch (e) {
              print('Error al procesar cita de lista $i: $e');
              // Continuar con la siguiente
            }
          }
          
          return citas;
        } else {
          print('Formato de respuesta inesperado: ${jsonData.runtimeType}');
          return [];
        }
      } else {
        print('Error en la respuesta: ${response.statusCode} - ${response.body}');
        throw Exception('Problema al cargar los datos de las citas! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al obtener citas: $e');
      throw Exception('Error al obtener citas: $e');
    }
  }

  // Método para obtener una cita por ID
  Future<Cita> getCitaPorId(String token, String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final dynamic jsonData = jsonDecode(response.body);
        
        if (jsonData is Map<String, dynamic>) {
          if (jsonData.containsKey('cita')) {
            return Cita.fromJson(jsonData['cita']);
          } else {
            return Cita.fromJson(jsonData);
          }
        } else {
          throw Exception('Formato de respuesta inválido');
        }
      } else {
        throw Exception('Problema al cargar la cita! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al obtener cita por ID: $e');
      throw Exception('Error al obtener cita: $e');
    }
  }

  // Método para agregar una cita
  Future<void> addCita(String token, Cita cita) async {
    try {
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(cita.toJson()),
      );

      print('Respuesta al agregar cita: ${response.body}');

      if (response.statusCode != 201) {
        throw Exception('Problema al agregar la cita! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al agregar cita: $e');
      throw Exception('Error al agregar cita: $e');
    }
  }

  // Método para actualizar una cita
  Future<void> updateCita(String token, Cita cita) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/${cita.id}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(cita.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Problema al actualizar la cita! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al actualizar cita: $e');
      throw Exception('Error al actualizar cita: $e');
    }
  }

  // Método para cambiar el estado de una cita
  Future<void> cambiarEstadoCita(String token, String id, String nuevoEstado, {String? motivoCancelacion}) async {
    try {
      final Map<String, dynamic> data = {
        'estadocita': nuevoEstado,
      };
      
      if (nuevoEstado == 'Cancelada' && motivoCancelacion != null) {
        data['motivoCancelacion'] = motivoCancelacion;
        data['fechaCancelacion'] = DateFormat('yyyy-MM-dd').format(DateTime.now());
      }
      
      final response = await http.patch(
        Uri.parse('$baseUrl/$id/estado'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      );

      if (response.statusCode != 200) {
        throw Exception('Problema al cambiar el estado de la cita! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al cambiar estado de cita: $e');
      throw Exception('Error al cambiar estado de cita: $e');
    }
  }

  // Método para eliminar una cita
  Future<void> deleteCita(String token, String id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Problema al eliminar la cita! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al eliminar cita: $e');
      throw Exception('Error al eliminar cita: $e');
    }
  }
  
  // Método para verificar disponibilidad
  Future<bool> verificarDisponibilidad(String token, DateTime fecha, String empleadoId, String horaInicio, int duracion, {String? citaIdExcluir}) async {
    try {
      final fechaFormateada = DateFormat('yyyy-MM-dd').format(fecha);
      String url = '$baseUrl/disponibilidad?fechacita=$fechaFormateada&empleadoId=$empleadoId&horaInicio=$horaInicio&duracion=$duracion';
      
      if (citaIdExcluir != null) {
        url += '&excluirCitaId=$citaIdExcluir';
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        return jsonData['disponible'] ?? false;
      } else {
        throw Exception('Problema al verificar disponibilidad! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al verificar disponibilidad: $e');
      throw Exception('Error al verificar disponibilidad: $e');
    }
  }
}
