import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/models/usuario.dart';

class ApiUsuario {
  static const String baseUrl = "https://gitbf.onrender.com/api/usuarios";

  // Método para obtener los usuarios (GET)
  Future<List<Usuario>> getUsuarios(String token) async {
    try {
      print('Obteniendo usuarios con token: $token');
      final response = await http.get(
        Uri.parse(baseUrl),
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
          // Si es un objeto, buscar la clave 'usuarios'
          if (jsonData.containsKey('usuarios')) {
            final List<dynamic> usuariosData = jsonData['usuarios'];
            print('Usuarios encontrados: ${usuariosData.length}');
            
            // Crear una lista para almacenar los usuarios procesados
            List<Usuario> usuarios = [];
            
            // Procesar cada usuario individualmente para capturar errores específicos
            for (var i = 0; i < usuariosData.length; i++) {
              try {
                var userData = usuariosData[i];
                print('Procesando usuario $i: $userData');
                usuarios.add(Usuario.fromJson(userData));
              } catch (e) {
                print('Error al procesar usuario $i: $e');
                // Continuar con el siguiente usuario en lugar de fallar completamente
              }
            }
            
            return usuarios;
          } else {
            // Buscar cualquier lista en la respuesta que pueda contener usuarios
            for (var key in jsonData.keys) {
              if (jsonData[key] is List) {
                print('Encontrada lista en clave: $key');
                final List<dynamic> possibleUsers = jsonData[key];
                if (possibleUsers.isNotEmpty && possibleUsers[0] is Map<String, dynamic>) {
                  print('Intentando mapear lista de $key como usuarios');
                  
                  // Crear una lista para almacenar los usuarios procesados
                  List<Usuario> usuarios = [];
                  
                  // Procesar cada usuario individualmente
                  for (var i = 0; i < possibleUsers.length; i++) {
                    try {
                      usuarios.add(Usuario.fromJson(possibleUsers[i]));
                    } catch (e) {
                      print('Error al procesar posible usuario $i: $e');
                      // Continuar con el siguiente
                    }
                  }
                  
                  return usuarios;
                }
              }
            }
            
            // Si no hay una lista clara, intentar usar todo el objeto como un solo usuario
            if (jsonData.containsKey('_id') || jsonData.containsKey('id') || 
                jsonData.containsKey('nombre') || jsonData.containsKey('email')) {
              print('Intentando mapear objeto como un solo usuario');
              try {
                return [Usuario.fromJson(jsonData)];
              } catch (e) {
                print('Error al procesar objeto como usuario: $e');
                return [];
              }
            }
            
            print('No se encontró una estructura de usuarios reconocible');
            return [];
          }
        } else if (jsonData is List) {
          // Si la respuesta es directamente una lista, asumimos que son usuarios
          print('La respuesta es una lista directa. Elementos: ${jsonData.length}');
          
          // Crear una lista para almacenar los usuarios procesados
          List<Usuario> usuarios = [];
          
          // Procesar cada usuario individualmente
          for (var i = 0; i < jsonData.length; i++) {
            try {
              usuarios.add(Usuario.fromJson(jsonData[i]));
            } catch (e) {
              print('Error al procesar usuario de lista $i: $e');
              // Continuar con el siguiente
            }
          }
          
          return usuarios;
        } else {
          print('Formato de respuesta inesperado: ${jsonData.runtimeType}');
          return [];
        }
      } else {
        print('Error en la respuesta: ${response.statusCode} - ${response.body}');
        throw Exception('Problema al cargar los datos de los usuarios! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al obtener usuarios: $e');
      throw Exception('Error al obtener usuarios: $e');
    }
  }

  // Método para agregar un usuario (POST)
  Future<void> addUsuario(String token, Usuario usuario) async {
    try {
      // Convertir el usuario a JSON manualmente para tener más control
      Map<String, dynamic> usuarioJson = {
        'nombre': usuario.nombre,
        'email': usuario.email,
        'password': usuario.password,
        'confirmPassword': usuario.confirmPassword,
        'estado': usuario.estado,
      };
      
      // Manejar el campo rol según su tipo
      if (usuario.rol is Map) {
        if (usuario.rol.containsKey('_id')) {
          usuarioJson['rol'] = usuario.rol['_id'];
        } else if (usuario.rol.containsKey('nombreRol')) {
          usuarioJson['rol'] = usuario.rol['nombreRol'];
        }
      } else if (usuario.rol is String) {
        usuarioJson['rol'] = usuario.rol;
      }
      
      print("Cuerpo de la solicitud para agregar usuario: ${jsonEncode(usuarioJson)}");
      
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(usuarioJson),
      );

      print('Código de respuesta (POST): ${response.statusCode}');
      print('Respuesta del servidor (POST): ${response.body}');

      if (response.statusCode != 201) {
        throw Exception('Problema al agregar el usuario! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al agregar usuario: $e');
      throw Exception('Error al agregar usuario: $e');
    }
  }

  // Método para actualizar un usuario (PUT)
  Future<void> updateUsuario(String token, Usuario usuario) async {
    try {
      // Convertir el usuario a JSON manualmente para tener más control
      Map<String, dynamic> usuarioJson = {
        'nombre': usuario.nombre,
        'email': usuario.email,
        'estado': usuario.estado,
      };
      
      // Solo incluir password si se proporcionó uno nuevo
      if (usuario.password.isNotEmpty) {
        usuarioJson['password'] = usuario.password;
        usuarioJson['confirmPassword'] = usuario.confirmPassword;
      }
      
      // Manejar el campo rol según su tipo
      if (usuario.rol is Map) {
        if (usuario.rol.containsKey('_id')) {
          usuarioJson['rol'] = usuario.rol['_id'];
        } else if (usuario.rol.containsKey('nombreRol')) {
          usuarioJson['rol'] = usuario.rol['nombreRol'];
        }
      } else if (usuario.rol is String) {
        usuarioJson['rol'] = usuario.rol;
      }
      
      print("Cuerpo de la solicitud para actualizar usuario: ${jsonEncode(usuarioJson)}");
      
      final response = await http.put(
        Uri.parse('$baseUrl/${usuario.id}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(usuarioJson),
      );

      print('Código de respuesta (PUT): ${response.statusCode}');
      print('Respuesta del servidor (PUT): ${response.body}');

      if (response.statusCode != 200) {
        throw Exception('Problema al actualizar el usuario! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al actualizar usuario: $e');
      throw Exception('Error al actualizar usuario: $e');
    }
  }

  // Método para eliminar un usuario (DELETE)
  Future<void> deleteUsuario(String token, String id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('Código de respuesta (DELETE): ${response.statusCode}');
      print('Respuesta del servidor (DELETE): ${response.body}');

      if (response.statusCode != 200) {
        throw Exception('Problema al eliminar el usuario! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al eliminar usuario: $e');
      throw Exception('Error al eliminar usuario: $e');
    }
  }
}
