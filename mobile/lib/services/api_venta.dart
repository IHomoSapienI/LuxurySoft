import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/models/venta.dart';

class ApiVenta {
  static const String baseUrl = "https://gitbf.onrender.com/api/ventas";

  Future<List<Venta>> getVentas(String token) async {
    final response = await http.get(
      Uri.parse(baseUrl),
      headers: {
        'Authorization' : 'Bearer $token',
        'Content-Type' : 'application/json'
      },
    );

    if (response.statusCode == 200) {
      print('Respuesta del servidor: ${response.body}');
      final Map<String, dynamic> jsonData = jsonDecode(response.body);
      final List<dynamic> ventasData = jsonData['ventas'];
      return ventasData.map((item) => Venta.fromJson(item)).toList();
    } else {
      throw Exception('Problema al cargar los Datos');
    }
  }

}
