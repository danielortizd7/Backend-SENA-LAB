/**
 * SOLUCIÓN ANDROID: REGENERAR TOKEN FCM
 * Copia este código en tu aplicación Android
 */

// En tu MainActivity o donde inicializes Firebase
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Regenerar token FCM
        regenerarTokenFCM();
    }
    
    private void regenerarTokenFCM() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (!task.isSuccessful()) {
                        Log.w("FCM", "Fetching FCM registration token failed", task.getException());
                        return;
                    }

                    // Obtener nuevo token
                    String token = task.getResult();
                    Log.d("FCM", "FCM Registration Token: " + token);
                    
                    // Enviar token al backend
                    enviarTokenAlBackend(token);
                }
            });
    }
    
    private void enviarTokenAlBackend(String token) {
        // Tu código para enviar el token al backend
        // URL: https://backend-registro-muestras.onrender.com/api/notificaciones/register-token
        
        String url = "https://backend-registro-muestras.onrender.com/api/notificaciones/register-token";
        
        // Crear el JSON body
        JSONObject jsonBody = new JSONObject();
        try {
            jsonBody.put("token", token);
            jsonBody.put("clienteDocumento", "1235467890"); // Tu documento
            jsonBody.put("platform", "android");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        
        // Hacer request POST
        // (Usa tu método preferido: OkHttp, Retrofit, etc.)
        Log.d("FCM", "Enviando token al backend: " + token);
    }
}

// ============================================
// MÉTODO ALTERNATIVO: USANDO RETROFIT
// ============================================

// Interface para el API
public interface NotificationAPI {
    @POST("api/notificaciones/register-token")
    Call<ResponseBody> registerToken(@Body TokenRequest tokenRequest);
}

// Clase para el request
public class TokenRequest {
    private String token;
    private String clienteDocumento;
    private String platform;
    
    public TokenRequest(String token, String clienteDocumento, String platform) {
        this.token = token;
        this.clienteDocumento = clienteDocumento;
        this.platform = platform;
    }
    
    // Getters y setters...
}

// Uso con Retrofit
private void enviarTokenConRetrofit(String token) {
    Retrofit retrofit = new Retrofit.Builder()
        .baseUrl("https://backend-registro-muestras.onrender.com/")
        .addConverterFactory(GsonConverterFactory.create())
        .build();
    
    NotificationAPI api = retrofit.create(NotificationAPI.class);
    
    TokenRequest request = new TokenRequest(token, "1235467890", "android");
    
    Call<ResponseBody> call = api.registerToken(request);
    call.enqueue(new Callback<ResponseBody>() {
        @Override
        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
            if (response.isSuccessful()) {
                Log.d("FCM", "Token registrado exitosamente");
            } else {
                Log.e("FCM", "Error al registrar token: " + response.code());
            }
        }
        
        @Override
        public void onFailure(Call<ResponseBody> call, Throwable t) {
            Log.e("FCM", "Error de conexión: " + t.getMessage());
        }
    });
}
