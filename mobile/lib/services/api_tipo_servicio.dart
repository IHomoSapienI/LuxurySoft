import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/models/tipo_servicio.dart';

class ApiTipoServicio {
  static const String baseUrl = "https://gitbf.onrender.com/api/tiposervicios";

  Future<List<TipoServicio>> getTipoServicios() async {
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List<dynamic>? tipoServiciosData = jsonData['tiposervicios'];
      if (tipoServiciosData == null) {
        throw Exception('El campo tiposervicios no está presente en la respuesta');
      }
      return tipoServiciosData.map((item) => TipoServicio.fromJson(item)).toList();
    } else {
      throw Exception('Problema al cargar los datos! Código: ${response.statusCode}');
    }
  }

  Future<void> createTipoServicio(String nombreTs, bool estado) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({'nombreTs': nombreTs, 'activo': estado}),
    );
    if (response.statusCode != 201) {
      throw Exception("Error al registrar tipo de servicio: ${response.body}");
    }
  }

  Future<void> updateTipoServicio(String id, String nombreTs, bool estado) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$id'),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({'nombreTs': nombreTs, 'activo': estado}),
    );

    if (response.statusCode != 200) {
      throw Exception("Error al actualizar el tipo de servicio: ${response.body}");
    }
  }

  Future<void> deleteTipoServicio(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/$id'),
      headers: {"Content-Type": "application/json"},
    );

    if (response.statusCode != 200) {
      throw Exception("Error al eliminar el tipo de servicio: ${response.body}");
    }
  }
}
