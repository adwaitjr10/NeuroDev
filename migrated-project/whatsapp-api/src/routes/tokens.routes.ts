Filename: main.au3
#include <MsgBoxConstants.au3>
#include <SQLite.au3>
#include <Date.au3>

; Controller
Func TokensController()
    Local $sPath = @ScriptDir & "/database.db"
    Local $hQuery, $aRow, $sPhone, $sToken, $iResult

    Switch @Opt
        Case "create"
            $sPhone = @ScriptLineComments(1)
            $sToken = _GenerateToken()
            $hQuery = _SQLite_Exec(-1, "INSERT INTO tokens (phone, token, created_at) VALUES ('" & $sPhone & "', '" & $sToken & "', '" & _NowCalc() & "');")
            If @error Then
                MsgBox($MB_SYSTEMMODAL, "Error", "Failed to create token: " & @error)
            Else
                MsgBox($MB_SYSTEMMODAL, "Success", "Token created for " & $sPhone & ": " & $sToken)
            EndIf

        Case "index"
            $hQuery = _SQLite_GetTable(-1, "SELECT * FROM tokens;")
            If @error Then
                MsgBox($MB_SYSTEMMODAL, "Error", "Failed to retrieve tokens: " & @error)
            Else
                For $i = 1 To $hQuery[0][0]
                    $aRow = $hQuery[$i]
                    MsgBox($MB_SYSTEMMODAL, "Token", "Phone: " & $aRow[1] & ", Token: " & $aRow[2] & ", Created At: " & $aRow[3])
                Next
            EndIf

        Case "delete"
            $sPhone = @ScriptLineComments(1)
            $iResult = _SQLite_Exec(-1, "DELETE FROM tokens WHERE phone = '" & $sPhone & "';")
            If @error Then
                MsgBox($MB_SYSTEMMODAL, "Error", "Failed to delete token for " & $sPhone & ": " & @error)
            Else
                MsgBox($MB_SYSTEMMODAL, "Success", "Token deleted for " & $sPhone)
            EndIf

    EndSwitch
EndFunc

; Helper Functions
Func _GenerateToken()
    Local $sToken = ""
    For $i = 1 To 6
        $sToken &= Random(0, 9, 1)
    Next
    Return $sToken
EndFunc

; Main
If _SQLite_Open(@ScriptDir & "/database.db") Then
    TokensController()
    _SQLite_Close()
Else
    MsgBox($MB_SYSTEMMODAL, "Error", "Failed to open database: " & @error)
EndIf