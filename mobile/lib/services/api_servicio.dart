import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/models/servicio.dart';

class ApiServicio {
  static const String baseUrl = "https://gitbf.onrender.com/api/servicios";

  // Método para obtener los servicios (GET)
  Future<List<Servicio>> getServicios(String token) async {
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      print('Respuesta del servidor: ${response.body}');
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List<dynamic> serviciosData = jsonData['servicios'];
      return serviciosData.map((item) => Servicio.fromJson(item)).toList();
    } else {
      throw Exception('Problema al cargar los datos!');
    }
  }

  // Método para agregar un servicio (POST)
  Future<void> addServicio(String token, Servicio servicio) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(servicio.toJson()),
    );

    if (response.statusCode != 201) {
      throw Exception('Problema al agregar el servicio!');
    }
  }

  // Método para actualizar un servicio (PUT)
  Future<void> updateServicio(String token, Servicio servicio) async {
    final response = await http.put(
      Uri.parse('$baseUrl/${servicio.id}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(servicio.toJson()),
    );

    if (response.statusCode != 200) {
      throw Exception('Problema al actualizar el servicio!');
    }
  }

  // Método para eliminar un servicio (DELETE)
  Future<void> deleteServicio(String token, String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/$id'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Problema al eliminar el servicio!');
    }
  }
}
